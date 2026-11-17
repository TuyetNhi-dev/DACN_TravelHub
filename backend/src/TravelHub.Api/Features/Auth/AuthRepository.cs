using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Auth;

public sealed class AuthRepository(MySqlConnectionFactory connections)
{
    private const string AccountColumns =
        "SELECT id, full_name, email, phone, password_hash, google_subject, status FROM users";

    public Task<Account?> FindByEmailAsync(string email, CancellationToken ct) =>
        FindAsync(AccountColumns + " WHERE email = @value", email, ct);

    public Task<Account?> FindByIdAsync(ulong id, CancellationToken ct) =>
        FindAsync(AccountColumns + " WHERE id = @value", id, ct);

    public Task<Account?> FindByGoogleSubjectAsync(string subject, CancellationToken ct) =>
        FindAsync(AccountColumns + " WHERE google_subject = @value", subject, ct);

    private async Task<Account?> FindAsync(string sql, object value, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@value", value);
        var row = await command.ReadSingleAsync(reader => new
        {
            Id = reader.GetUInt64("id"),
            FullName = reader.GetString("full_name"),
            Email = reader.GetString("email"),
            Phone = reader.GetNullableString("phone"),
            Hash = reader.GetNullableString("password_hash"),
            GoogleSubject = reader.GetNullableString("google_subject"),
            Status = reader.GetString("status"),
        }, ct);
        if (row is null) return null;
        var roles = await ListActiveRolesAsync(connection, row.Id, ct);
        var user = new AuthUserDto(row.Id.ToString(System.Globalization.CultureInfo.InvariantCulture),
            row.FullName, row.Email, row.Phone, roles);
        return new Account(user, row.Hash, row.GoogleSubject, row.Status);
    }

    private static async Task<IReadOnlyList<RoleAssignmentDto>> ListActiveRolesAsync(
        MySqlConnection connection, ulong userId, CancellationToken ct)
    {
        await using var command = new MySqlCommand("""
            SELECT r.code, a.scope, a.region_id, a.branch_id
            FROM user_role_assignments a JOIN roles r ON r.id = a.role_id
            WHERE a.user_id = @id AND a.is_active = 1
            """, connection);
        command.Parameters.AddWithValue("@id", userId);
        return await command.ReadAllAsync(reader => new RoleAssignmentDto(
            reader.GetString("code"), reader.GetString("scope"),
            reader.GetNullableId("region_id"), reader.GetNullableId("branch_id")), ct);
    }

    /// <summary>
    /// Creates a user and its CUSTOMER/self assignment atomically and returns the new id. Roles never come
    /// from the request. Password sign-ups start pending; Google sign-ups start active (Google verified the email).
    /// </summary>
    public async Task<ulong> CreateCustomerAsync(NewCustomer customer, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        await using var command = new MySqlCommand("""
            INSERT INTO users (full_name, email, phone, password_hash, google_subject, status)
            VALUES (@name, @email, @phone, @hash, @google, @status)
            """, connection, transaction);
        command.Parameters.AddWithValue("@name", customer.FullName);
        command.Parameters.AddWithValue("@email", customer.Email);
        command.Parameters.AddWithValue("@phone", customer.Phone);
        command.Parameters.AddWithValue("@hash", customer.PasswordHash);
        command.Parameters.AddWithValue("@google", customer.GoogleSubject);
        command.Parameters.AddWithValue("@status", customer.Status);
        await command.ExecuteNonQueryAsync(ct);
        var userId = command.LastInsertedId;
        await AssignCustomerRoleAsync(command, userId, ct);
        await transaction.CommitAsync(ct);
        return (ulong)userId;
    }

    /// <summary>Saves the customer's contact number, used for every later booking.</summary>
    public async Task UpdatePhoneAsync(ulong userId, string phone, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("UPDATE users SET phone = @phone WHERE id = @id", connection);
        command.Parameters.AddWithValue("@phone", phone);
        command.Parameters.AddWithValue("@id", userId);
        await command.ExecuteNonQueryAsync(ct);
    }

    /// <summary>
    /// Links a Google account to an existing user found by its verified email. A pending sign-up becomes active,
    /// because Google has just proven ownership of the address. Never overwrites a different existing link.
    /// </summary>
    public async Task<bool> LinkGoogleAsync(ulong userId, string subject, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            UPDATE users
            SET google_subject = @subject, status = IF(status = @pending, @active, status)
            WHERE id = @id AND google_subject IS NULL
            """, connection);
        command.Parameters.AddWithValue("@subject", subject);
        command.Parameters.AddWithValue("@pending", AccountStatus.Pending);
        command.Parameters.AddWithValue("@active", AccountStatus.Active);
        command.Parameters.AddWithValue("@id", userId);
        return await command.ExecuteNonQueryAsync(ct) == 1;
    }

    private static async Task AssignCustomerRoleAsync(MySqlCommand command, long userId, CancellationToken ct)
    {
        command.Parameters.Clear();
        command.Parameters.AddWithValue("@code", RoleCodes.Customer);
        // Reference row from seeds/001; kept idempotent so registration also works on a fresh database.
        command.CommandText = "INSERT IGNORE INTO roles (code, name) VALUES (@code, 'Khách hàng')";
        await command.ExecuteNonQueryAsync(ct);

        command.CommandText = """
            INSERT INTO user_role_assignments (user_id, role_id, scope, is_active)
            SELECT @userId, id, @scope, 1 FROM roles WHERE code = @code
            """;
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@scope", RoleScopes.Self);
        await command.ExecuteNonQueryAsync(ct);
    }
}
