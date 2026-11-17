using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin;

/// <summary>
/// Back-office access. With three roles there are no branch or region limits: an active STAFF or ADMIN
/// assignment with global scope sees every order. IsAdmin is kept for admin-only actions.
/// </summary>
public sealed record StaffScope(bool IsAdmin)
{
    public static StaffScope? From(AuthUserDto user)
    {
        var operators = user.Roles
            .Where(role => RoleCodes.Operators.Contains(role.Code) && role.Scope == RoleScopes.Global)
            .ToList();
        if (operators.Count == 0) return null;
        return new StaffScope(operators.Any(role => role.Code == RoleCodes.Admin));
    }
}
