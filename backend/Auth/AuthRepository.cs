using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Auth;

public sealed record RoleAssignment(string Code, string Scope, string? RegionId, string? BranchId);
public sealed record AuthUser(string Id, string FullName, string Email, string? Phone, IReadOnlyList<RoleAssignment> Roles);
public sealed record Account(AuthUser User, string? PasswordHash, string Status);

public sealed class AuthRepository(MySqlConnectionFactory connections)
{
    public Task<Account?> FindByEmailAsync(string email, CancellationToken ct) => FindAsync("email", email, ct);
    public Task<Account?> FindByIdAsync(string id, CancellationToken ct) => FindAsync("id", id, ct);

    private async Task<Account?> FindAsync(string column, string value, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(
            $"SELECT id,full_name,email,phone,password_hash,status FROM users WHERE {column}=@value LIMIT 1", connection);
        command.Parameters.AddWithValue("@value", value);
        string id, name, email, status;
        string? phone, hash;
        await using (var reader = await command.ExecuteReaderAsync(ct))
        {
            if (!await reader.ReadAsync(ct)) return null;
            id = reader.GetUInt64(0).ToString(System.Globalization.CultureInfo.InvariantCulture);
            name = reader.GetString(1); email = reader.GetString(2);
            phone = reader.IsDBNull(3) ? null : reader.GetString(3);
            hash = reader.IsDBNull(4) ? null : reader.GetString(4);
            status = reader.GetString(5);
        }
        command.CommandText = """
            SELECT r.code,a.scope,CAST(a.region_id AS CHAR),CAST(a.branch_id AS CHAR)
            FROM user_role_assignments a JOIN roles r ON r.id=a.role_id
            WHERE a.user_id=@id AND a.is_active=1
            """;
        command.Parameters.Clear(); command.Parameters.AddWithValue("@id", id);
        var roles = new List<RoleAssignment>();
        await using (var reader = await command.ExecuteReaderAsync(ct))
            while (await reader.ReadAsync(ct))
                roles.Add(new(reader.GetString(0), reader.GetString(1),
                    reader.IsDBNull(2) ? null : reader.GetString(2), reader.IsDBNull(3) ? null : reader.GetString(3)));
        return new(new(id, name, email, phone, roles), hash, status);
    }

    public async Task RegisterAsync(string name, string email, string phone, string hash, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        await using var command = new MySqlCommand("""
            INSERT INTO users(full_name,email,phone,password_hash,status)
            VALUES(@name,@email,@phone,@hash,'active')
            """, connection, transaction);
        command.Parameters.AddWithValue("@name", name); command.Parameters.AddWithValue("@email", email);
        command.Parameters.AddWithValue("@phone", phone); command.Parameters.AddWithValue("@hash", hash);
        await command.ExecuteNonQueryAsync(ct);
        var userId = command.LastInsertedId;
        // This is reference data, not a schema change; never accept a role from the request.
        command.CommandText = "INSERT INTO roles(code,name) VALUES('CUSTOMER','Khách hàng') ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)";
        command.Parameters.Clear(); await command.ExecuteNonQueryAsync(ct);
        command.CommandText = """
            INSERT INTO user_role_assignments(user_id,role_id,scope,is_active)
            SELECT @userId,id,'self',1 FROM roles WHERE code='CUSTOMER'
            """;
        command.Parameters.AddWithValue("@userId", userId);
        await command.ExecuteNonQueryAsync(ct);
        await transaction.CommitAsync(ct);
    }
}
