using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin.Staff;

public sealed record StaffAssignmentRow(ulong Id, ulong UserId, string Email, string Role, string Scope,
    ulong? BranchId, bool IsActive);

public enum RevokeResult { Revoked, NotFound, LastAdmin }

public sealed class StaffRepository(MySqlConnectionFactory connections)
{
    private const string OperatorRoles = "('STAFF', 'BRANCH_MANAGER', 'ADMIN')";

    public async Task<IReadOnlyList<StaffMemberDto>> ListAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand($"""
            SELECT u.id AS user_id, u.full_name, u.email, a.id, r.code AS role, a.scope, a.region_id,
                rg.name AS region_name, a.branch_id, b.name AS branch_name
            FROM user_role_assignments a
            JOIN roles r ON r.id = a.role_id
            JOIN users u ON u.id = a.user_id
            LEFT JOIN regions rg ON rg.id = a.region_id
            LEFT JOIN branches b ON b.id = a.branch_id
            WHERE a.is_active = 1 AND r.code IN {OperatorRoles}
            ORDER BY u.full_name, u.id, a.id
            """, connection);
        var rows = await command.ReadAllAsync(r => (User: (Id: r.GetId("user_id"), Name: r.GetString("full_name"),
            Email: r.GetString("email")), Assignment: new StaffAssignmentDto(r.GetId("id"), r.GetString("role"),
            r.GetString("scope"), r.GetNullableId("region_id"), r.GetNullableString("region_name"),
            r.GetNullableId("branch_id"), r.GetNullableString("branch_name"))), ct);
        return rows.GroupBy(row => row.User).Select(g => new StaffMemberDto(g.Key.Id, g.Key.Name, g.Key.Email,
            g.Select(row => row.Assignment).ToList())).ToList();
    }

    /// <summary>Only active accounts can be given a back-office role.</summary>
    public async Task<ulong?> FindActiveUserAsync(string email, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(
            "SELECT id FROM users WHERE email = @email AND status = @active", connection);
        command.Parameters.AddWithValue("@email", email);
        command.Parameters.AddWithValue("@active", AccountStatus.Active);
        var id = await command.ExecuteScalarAsync(ct);
        return id is null or DBNull ? null : Convert.ToUInt64(id);
    }

    public async Task<StaffAssignmentRow?> FindAsync(ulong id, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT a.id, a.user_id, u.email, r.code, a.scope, a.branch_id, a.is_active
            FROM user_role_assignments a JOIN roles r ON r.id = a.role_id JOIN users u ON u.id = a.user_id
            WHERE a.id = @id
            """, connection);
        command.Parameters.AddWithValue("@id", id);
        return await command.ReadSingleAsync(r => new StaffAssignmentRow(r.GetUInt64("id"), r.GetUInt64("user_id"),
            r.GetString("email"), r.GetString("code"), r.GetString("scope"),
            r.IsDBNull(r.GetOrdinal("branch_id")) ? null : r.GetUInt64("branch_id"), r.GetBoolean("is_active")), ct);
    }

    /// <summary>Null when the user already holds exactly this active role and scope.</summary>
    public Task<ulong?> InsertAsync(ulong userId, ValidStaffAssignment a, Func<ulong, AuditEntry> audit,
        CancellationToken ct) => connections.InTransactionAsync<ulong?>(async tx =>
        {
            await using var existing = tx.Command("""
                SELECT COUNT(*) FROM user_role_assignments x JOIN roles r ON r.id = x.role_id
                WHERE x.user_id = @user AND r.code = @role AND x.scope = @scope AND x.is_active = 1
                    AND x.region_id <=> @region AND x.branch_id <=> @branch
                FOR UPDATE
                """, ("@user", userId), ("@role", a.Role), ("@scope", a.Scope), ("@region", a.RegionId),
                ("@branch", a.BranchId));
            if (Convert.ToInt32(await existing.ExecuteScalarAsync(ct)) > 0) return null;
            var id = await tx.InsertAsync("""
                INSERT INTO user_role_assignments (user_id, role_id, scope, region_id, branch_id, is_active)
                SELECT @user, id, @scope, @region, @branch, 1 FROM roles WHERE code = @role
                """, ct, ("@user", userId), ("@role", a.Role), ("@scope", a.Scope), ("@region", a.RegionId),
                ("@branch", a.BranchId));
            if (id == 0)
                throw ApiException.Conflict(
                    "Vai trò này chưa có trong database. Hãy chạy lại seeds/001_reference_data.sql.");
            await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit(id), ct);
            return id;
        }, ct);

    /// <summary>Refuses to remove the last active global ADMIN, so the back office is never left without one.</summary>
    public Task<RevokeResult> RevokeAsync(StaffAssignmentRow row, AuditEntry audit, CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            if (row.Role == RoleCodes.Admin)
            {
                await using var admins = tx.Command($"""
                    SELECT COUNT(*) FROM user_role_assignments x JOIN roles r ON r.id = x.role_id
                    WHERE r.code = '{RoleCodes.Admin}' AND x.scope = 'global' AND x.is_active = 1 FOR UPDATE
                    """);
                if (Convert.ToInt32(await admins.ExecuteScalarAsync(ct)) <= 1) return RevokeResult.LastAdmin;
            }
            var rows = await tx.ExecuteAsync(
                "UPDATE user_role_assignments SET is_active = 0 WHERE id = @id AND is_active = 1", ct, ("@id", row.Id));
            if (rows == 0) return RevokeResult.NotFound;
            await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit, ct);
            return RevokeResult.Revoked;
        }, ct);
}
