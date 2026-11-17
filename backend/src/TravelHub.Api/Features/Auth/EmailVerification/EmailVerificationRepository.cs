using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Auth.EmailVerification;

public sealed record PendingCode(ulong Id, string CodeHash, int FailedAttempts);

/// <summary>NoActiveCode covers expired, already used and retired-after-too-many-attempts codes.</summary>
public enum CodeCheck { Verified, Wrong, NoActiveCode }

public sealed record CodeCheckResult(CodeCheck Outcome, int AttemptsLeft = 0);

public sealed class EmailVerificationRepository(MySqlConnectionFactory connections)
{
    /// <summary>Stores a new code and retires the user's older unused ones, so only the latest code works.</summary>
    public async Task SaveCodeAsync(ulong userId, string codeHash, DateTime nowUtc, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        await using var command = new MySqlCommand("""
            UPDATE email_verification_tokens SET used_at = @now WHERE user_id = @userId AND used_at IS NULL
            """, connection, transaction);
        command.Parameters.AddWithValue("@now", nowUtc);
        command.Parameters.AddWithValue("@userId", userId);
        await command.ExecuteNonQueryAsync(ct);

        command.CommandText = """
            INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, created_at)
            VALUES (@userId, @hash, @expiresAt, @now)
            """;
        command.Parameters.AddWithValue("@hash", codeHash);
        command.Parameters.AddWithValue("@expiresAt", nowUtc.Add(VerificationCode.Lifetime));
        await command.ExecuteNonQueryAsync(ct);
        await transaction.CommitAsync(ct);
    }

    public async Task<bool> HasCodeSinceAsync(ulong userId, DateTime sinceUtc, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT EXISTS (SELECT 1 FROM email_verification_tokens WHERE user_id = @userId AND created_at > @since)
            """, connection);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@since", sinceUtc);
        return Convert.ToBoolean(await command.ExecuteScalarAsync(ct));
    }

    /// <summary>
    /// Checks a code for a pending user under a row lock, so parallel guesses are counted one by one.
    /// A match activates the user; a miss adds an attempt and retires the code at the limit.
    /// </summary>
    public async Task<CodeCheckResult> TryConsumeAsync(ulong userId, Func<PendingCode, bool> matches,
        DateTime nowUtc, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT id, token_hash, expires_at, failed_attempts FROM email_verification_tokens
            WHERE user_id = @userId AND used_at IS NULL AND expires_at > @now
            ORDER BY created_at DESC LIMIT 1
            FOR UPDATE
            """, connection, transaction);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@now", nowUtc);
        var code = await command.ReadSingleAsync(reader => new PendingCode(reader.GetUInt64("id"),
            reader.GetString("token_hash"), reader.GetInt32("failed_attempts")), ct);
        if (code is null) return new CodeCheckResult(CodeCheck.NoActiveCode);

        var ok = matches(code);
        command.Parameters.Clear();
        command.CommandText = ok ? ActivateSql : FailSql;
        command.Parameters.AddWithValue("@id", code.Id);
        command.Parameters.AddWithValue("@now", nowUtc);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@active", AccountStatus.Active);
        command.Parameters.AddWithValue("@pending", AccountStatus.Pending);
        command.Parameters.AddWithValue("@limit", VerificationCode.MaxFailedAttempts);
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

    // MySQL evaluates single-table SET assignments left to right, so used_at must read failed_attempts
    // before it is incremented.
    private const string FailSql = """
        UPDATE email_verification_tokens
        SET used_at = IF(failed_attempts + 1 >= @limit, @now, used_at),
            failed_attempts = failed_attempts + 1
        WHERE id = @id;
        """;
}
