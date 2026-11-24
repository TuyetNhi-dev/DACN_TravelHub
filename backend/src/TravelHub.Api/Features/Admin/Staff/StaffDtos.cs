using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin.Staff;

public sealed record StaffAssignmentDto(string Id, string Role, string Scope, string? RegionId, string? RegionName,
    string? BranchId, string? BranchName);

public sealed record StaffMemberDto(string UserId, string FullName, string Email,
    IReadOnlyList<StaffAssignmentDto> Assignments, string AccountStatus = Auth.AccountStatus.Active);

public sealed record AssignStaffRequest(string? Email, string? Role, string? Scope, string? RegionId,
    string? BranchId);

public sealed record ValidStaffAssignment(string Email, string Role, string Scope, ulong? RegionId, ulong? BranchId);

/// <summary>Who may be given which role and scope. Pure, unit-tested.</summary>
public static class StaffRules
{
    /// <summary>An admin never removes their own role or locks their own account (no self-lockout).</summary>
    public static void EnsureNotSelf(ulong actorId, ulong targetUserId, string message)
    {
        if (actorId == targetUserId) throw ApiException.Conflict(message);
    }

    public static readonly IReadOnlySet<string> AssignableRoles =
        new HashSet<string> { RoleCodes.Staff, RoleCodes.BranchManager, RoleCodes.Admin };

    public static readonly IReadOnlySet<string> StaffScopes =
        new HashSet<string> { RoleScopes.Global, RoleScopes.Region, RoleScopes.Branch };

    public static ValidStaffAssignment Validate(AssignStaffRequest request)
    {
        var errors = new ValidationErrors();
        var email = request.Email?.Trim().ToLowerInvariant() ?? "";
        errors.AddIf(email.Length is < 3 or > 254 || !email.Contains('@'), "email", "Email không hợp lệ.");
        var role = request.Role ?? "";
        var scope = request.Scope ?? "";
        errors.AddIf(!AssignableRoles.Contains(role), "role", "Vai trò không hợp lệ.");
        errors.AddIf(!StaffScopes.Contains(scope), "scope", "Phạm vi không hợp lệ.");
        errors.AddIf(role == RoleCodes.Admin && scope != RoleScopes.Global, "scope",
            "Quản trị viên luôn có phạm vi toàn quốc.");
        ulong? region = scope == RoleScopes.Region ? Id(request.RegionId, "regionId", "Chọn khu vực.", errors) : null;
        ulong? branch = scope == RoleScopes.Branch ? Id(request.BranchId, "branchId", "Chọn chi nhánh.", errors) : null;
        errors.ThrowIfAny();
        return new ValidStaffAssignment(email, role, scope, region, branch);
    }

    private static ulong? Id(string? raw, string field, string message, ValidationErrors errors)
    {
        if (ResourceId.TryParse(raw, out var id)) return id;
        errors.Add(field, message);
        return null;
    }
}
