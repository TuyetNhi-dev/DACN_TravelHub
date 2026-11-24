using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin.Staff;

/// <summary>"Nhân viên & phân quyền": admins give existing accounts a back-office role and scope.</summary>
public sealed class StaffService(AdminAccessService accessService, StaffRepository repository)
{
    private const int MissingReference = 1452;

    public async Task<IReadOnlyList<StaffMemberDto>> ListAsync(Account account, CancellationToken ct)
    {
        await accessService.RequireAdminAsync(account, ct);
        return await repository.ListAsync(ct);
    }

    public async Task<IReadOnlyList<StaffMemberDto>> AssignAsync(Account account, AssignStaffRequest request,
        CancellationToken ct)
    {
        var access = await accessService.RequireAdminAsync(account, ct);
        var assignment = StaffRules.Validate(request);
        var userId = await repository.FindActiveUserAsync(assignment.Email, ct)
            ?? throw ApiException.NotFound("Không có tài khoản đang hoạt động với email này.");
        var audit = await accessService.AuditAsync(access, AuditActions.StaffAssign, AuditEntities.StaffAssignment,
            "", assignment.BranchId, $"Gán vai trò {assignment.Role} ({Describe(assignment)}) cho {assignment.Email}",
            null, ct);
        try
        {
            var id = await repository.InsertAsync(userId, assignment,
                newId => audit with { EntityId = ResourceId.Format(newId) }, ct);
            if (id is null) throw ApiException.Conflict("Tài khoản đã có đúng vai trò và phạm vi này.");
        }
        catch (MySqlException error) when (error.Number == MissingReference)
        {
            throw ApiException.BadRequest("Khu vực hoặc chi nhánh không tồn tại.");
        }
        return await repository.ListAsync(ct);
    }

    public async Task<IReadOnlyList<StaffMemberDto>> RevokeAsync(Account account, string rawId, CancellationToken ct)
    {
        var access = await accessService.RequireAdminAsync(account, ct);
        var row = await repository.FindAsync(ResourceId.Parse(rawId, "id"), ct);
        if (row is null || !row.IsActive || !StaffRules.AssignableRoles.Contains(row.Role))
            throw ApiException.NotFound("Không tìm thấy phân quyền.");
        StaffRules.EnsureNotSelf(access.UserId, row.UserId, "Không thể tự gỡ quyền của chính mình.");
        var audit = await accessService.AuditAsync(access, AuditActions.StaffRevoke, AuditEntities.StaffAssignment,
            ResourceId.Format(row.Id), row.BranchId, $"Gỡ vai trò {row.Role} ({row.Scope}) của {row.Email}", null, ct);
        var result = await repository.RevokeAsync(row, audit, ct);
        if (result == RevokeResult.LastAdmin)
            throw ApiException.Conflict("Không thể gỡ quản trị viên toàn quốc cuối cùng.");
        if (result == RevokeResult.NotFound) throw ApiException.NotFound("Không tìm thấy phân quyền.");
        return await repository.ListAsync(ct);
    }

    /// <summary>Locks or unlocks the sign-in of an account that holds a back-office role.</summary>
    public async Task<IReadOnlyList<StaffMemberDto>> SetLockedAsync(Account account, string rawUserId, bool locked,
        CancellationToken ct)
    {
        var access = await accessService.RequireAdminAsync(account, ct);
        var userId = ResourceId.Parse(rawUserId, "userId");
        StaffRules.EnsureNotSelf(access.UserId, userId, "Không thể tự khóa tài khoản của chính mình.");
        var user = await repository.FindUserAsync(userId, ct)
            ?? throw ApiException.NotFound("Không tìm thấy tài khoản.");
        var (from, to) = locked
            ? (AccountStatus.Active, AccountStatus.Disabled)
            : (AccountStatus.Disabled, AccountStatus.Active);
        var audit = await accessService.AuditAsync(access, locked ? AuditActions.UserLock : AuditActions.UserUnlock,
            AuditEntities.User, ResourceId.Format(userId), null,
            $"{(locked ? "Khóa" : "Mở khóa")} tài khoản {user.Email}", [new AuditChange("status", from, to)], ct);
        var result = await repository.SetAccountStatusAsync(userId, locked, audit, ct);
        if (result == LockResult.LastAdmin)
            throw ApiException.Conflict("Không thể khóa quản trị viên toàn quốc cuối cùng còn đăng nhập được.");
        if (result == LockResult.NotFound)
            throw ApiException.Conflict(locked ? "Tài khoản không ở trạng thái hoạt động." : "Tài khoản không bị khóa.");
        return await repository.ListAsync(ct);
    }

    private static string Describe(ValidStaffAssignment a) => a.Scope switch
    {
        RoleScopes.Region => $"khu vực #{a.RegionId}",
        RoleScopes.Branch => $"chi nhánh #{a.BranchId}",
        _ => "toàn quốc",
    };
}
