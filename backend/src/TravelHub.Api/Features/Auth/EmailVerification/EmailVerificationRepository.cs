using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Auth.EmailVerification;

public sealed record PendingCode(ulong Id, string CodeHash, int FailedAttempts);

/// <summary>NoActiveCode covers expired, already used and retired-after-too-many-attempts codes.</summary>
public enum CodeCheck { Verified, Wrong, NoActiveCode }

public sealed record CodeCheckResult(CodeCheck Outcome, int AttemptsLeft = 0);

/// <summary>What an OTP was issued for (email_verification_tokens.purpose, migration 014).</summary>
public static class CodePurpose
{
    public const string VerifyEmail = "verify_email";
    public const string ResetPassword = "reset_password";
}

/// <summary>
/// 6-digit email codes. Every query is scoped by purpose: a code works only for the flow it was issued for, and
/// a new code retires only the older unused codes of that same flow.
/// </summary>
public sealed class EmailVerificationRepository(MySqlConnectionFactory connections)
{
    /// <summary>Stores a new code and retires the user's older unused ones, so only the latest code works.</summary>
    public async Task SaveCodeAsync(ulong userId, string purpose, string codeHash, DateTime nowUtc,
        CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        await using var command = new MySqlCommand("""
            UPDATE email_verification_tokens SET used_at = @now
            WHERE user_id = @userId AND purpose = @purpose AND used_at IS NULL
            """, connection, transaction);
        command.Parameters.AddWithValue("@now", nowUtc);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@purpose", purpose);
        await command.ExecuteNonQueryAsync(ct);

        command.CommandText = """
            INSERT INTO email_verification_tokens (user_id, purpose, token_hash, expires_at, created_at)
            VALUES (@userId, @purpose, @hash, @expiresAt, @now)
            """;
        command.Parameters.AddWithValue("@hash", codeHash);
        command.Parameters.AddWithValue("@expiresAt", nowUtc.Add(VerificationCode.Lifetime));
        await command.ExecuteNonQueryAsync(ct);
        await transaction.CommitAsync(ct);
    }

    /// <summary>How many codes of this purpose were issued since a time (resend cooldown and hourly cap).</summary>
    public async Task<int> CountCodesSinceAsync(ulong userId, string purpose, DateTime sinceUtc, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT COUNT(*) FROM email_verification_tokens
            WHERE user_id = @userId AND purpose = @purpose AND created_at > @since
            """, connection);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@purpose", purpose);
        command.Parameters.AddWithValue("@since", sinceUtc);
        return Convert.ToInt32(await command.ExecuteScalarAsync(ct));
    }

    /// <summary>Email verification: a match activates a pending user.</summary>
    public Task<CodeCheckResult> TryVerifyEmailAsync(ulong userId, Func<PendingCode, bool> matches, DateTime nowUtc,
        CancellationToken ct) =>
        TryConsumeAsync(userId, CodePurpose.VerifyEmail, matches, nowUtc, ActivateSql, _ => { }, ct);

    /// <summary>
    /// Password reset: a match stores the new hash and activates a pending user in the same transaction, because a
    /// correct code also proves the user owns the address. The new hash changes the session stamp, which ends
    /// every existing session (see SessionValidator).
    /// </summary>
    public Task<CodeCheckResult> TryResetPasswordAsync(ulong userId, Func<PendingCode, bool> matches,
        string newPasswordHash, DateTime nowUtc, CancellationToken ct) =>
        TryConsumeAsync(userId, CodePurpose.ResetPassword, matches, nowUtc, ResetPasswordSql,
            parameters => parameters.AddWithValue("@hash", newPasswordHash), ct);

    /// <summary>
    /// Checks the latest live code of a purpose under a row lock, so parallel guesses are counted one by one.
    /// A match runs <paramref name="successSql"/>; a miss adds an attempt and retires the code at the limit.
    /// </summary>
    private async Task<CodeCheckResult> TryConsumeAsync(ulong userId, string purpose, Func<PendingCode, bool> matches,
        DateTime nowUtc, string successSql, Action<MySqlParameterCollection> addSuccessParameters, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT id, token_hash, expires_at, failed_attempts FROM email_verification_tokens
            WHERE user_id = @userId AND purpose = @purpose AND used_at IS NULL AND expires_at > @now
            ORDER BY created_at DESC LIMIT 1
            FOR UPDATE
            """, connection, transaction);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@purpose", purpose);
        command.Parameters.AddWithValue("@now", nowUtc);
        var code = await command.ReadSingleAsync(reader => new PendingCode(reader.GetUInt64("id"),
            reader.GetString("token_hash"), reader.GetInt32("failed_attempts")), ct);
        if (code is null) return new CodeCheckResult(CodeCheck.NoActiveCode);

        var ok = matches(code);
        command.Parameters.Clear();
        command.CommandText = ok ? successSql : FailSql;
        command.Parameters.AddWithValue("@id", code.Id);
        command.Parameters.AddWithValue("@now", nowUtc);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@active", AccountStatus.Active);
        command.Parameters.AddWithValue("@pending", AccountStatus.Pending);
        command.Parameters.AddWithValue("@limit", VerificationCode.MaxFailedAttempts);
        if (ok) addSuccessParameters(command.Parameters);
        await command.ExecuteNonQueryAsync(ct);
        await transaction.CommitAsync(ct);
        return ok
            ? new CodeCheckResult(CodeCheck.Verified)
            : new CodeCheckResult(CodeCheck.Wrong, VerificationCode.MaxFailedAttempts - code.FailedAttempts - 1);
    }

    private const string ActivateSql = """
        UPDATE email_verification_tokens SET used_at = @now WHERE id = @id;
        UPDATE users SET status = @active WHERE id = @userId AND status = @pending;
        """;

    private const string ResetPasswordSql = """
        UPDATE email_verification_tokens SET used_at = @now WHERE id = @id;
        UPDATE users SET password_hash = @hash, status = IF(status = @pending, @active, status) WHERE id = @userId;
        """;

    // MySQL evaluates single-table SET assignments left to right, so used_at must read failed_attempts
    // before it is incremented.
    private const string FailSql = """
        UPDATE email_verification_tokens
        SET used_at = IF(failed_attempts + 1 >= @limit, @now, used_at),
            failed_attempts = failed_attempts + 1
        WHERE id = @id;
        """;
}
