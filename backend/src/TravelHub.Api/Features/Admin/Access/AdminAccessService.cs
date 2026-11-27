using System.Globalization;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin.Access;

/// <summary>
/// Entry point of every /api/admin service: turns the signed-in account into an <see cref="AdminAccess"/> and
/// refuses with 403 before any data is read. Scoped, so the branch list is loaded at most once per request.
/// </summary>
public sealed class AdminAccessService(IBranchDirectory organization)
{
    private const string NotOperator = "Bạn không có quyền truy cập trang quản trị.";
    private IReadOnlyList<BranchRef>? branches;

    public async Task<IReadOnlyList<BranchRef>> BranchesAsync(CancellationToken ct) =>
        branches ??= await organization.ListBranchesAsync(ct);

    public async Task<AdminAccess> RequireAsync(Account account, CancellationToken ct)
    {
        // Customers are refused before any query: the branch list is only read for operators.
        if (!account.User.Roles.Any(role => RoleCodes.Operators.Contains(role.Code)))
            throw ApiException.Forbidden(NotOperator);
        return AdminScopeRules.Resolve(UserId(account), account.User.Roles, await BranchesAsync(ct))
            ?? throw ApiException.Forbidden(NotOperator);
    }

    public async Task<AdminAccess> RequireManagerAsync(Account account, CancellationToken ct)
    {
        var access = await RequireAsync(account, ct);
        return access.CanManageCatalog ? access
            : throw ApiException.Forbidden("Chỉ quản lý chi nhánh hoặc quản trị viên được thực hiện thao tác này.");
    }

    public async Task<AdminAccess> RequireAdminAsync(Account account, CancellationToken ct)
    {
        var access = await RequireAsync(account, ct);
        return access.IsAdmin ? access : throw ApiException.Forbidden("Chỉ quản trị viên được thực hiện thao tác này.");
    }

    public async Task<(AdminAccess Access, ScopeSet Scope)> SelectAsync(Account account, string? scope,
        CancellationToken ct)
    {
        var access = await RequireAsync(account, ct);
        return (access, AdminScopeRules.Select(access, scope, await BranchesAsync(ct)));
    }

    /// <summary>Refuses a change on an object of another branch: 404 when the user cannot even see it.</summary>
    public static void EnsureCanManage(AdminAccess access, ulong? branchId, string notFound)
    {
        if (!access.View.Covers(branchId)) throw ApiException.NotFound(notFound);
        if (!access.Manage.Covers(branchId))
            throw ApiException.Forbidden("Đối tượng này thuộc chi nhánh ngoài phạm vi quản lý của bạn.");
    }

    /// <summary>A branch the user assigns something to (a tour, a departure) must be one they manage.</summary>
    public async Task<BranchRef> RequireManagedBranchAsync(AdminAccess access, ulong branchId, CancellationToken ct)
    {
        var branch = (await BranchesAsync(ct)).FirstOrDefault(b => b.Id == branchId);
        if (branch is null || !access.Manage.Covers(branchId))
            throw new ApiValidationException(new Dictionary<string, string[]>
            {
                ["operatingBranchId"] = ["Chi nhánh không tồn tại hoặc nằm ngoài phạm vi quản lý của bạn."],
            });
        return branch;
    }

    /// <summary>Builds an audit row with the region of the object's branch filled in.</summary>
    public async Task<AuditEntry> AuditAsync(AdminAccess access, string action, string entityType, string entityId,
        ulong? branchId, string summary, IReadOnlyList<AuditChange>? changes, CancellationToken ct)
    {
        var branches = await BranchesAsync(ct);
        var region = branchId is null ? null : branches.FirstOrDefault(b => b.Id == branchId)?.RegionId;
        return new AuditEntry(access.UserId, action, entityType, entityId, branchId, region, summary, changes);
    }

    public static ulong UserId(Account account) => ulong.Parse(account.User.Id, CultureInfo.InvariantCulture);
}
