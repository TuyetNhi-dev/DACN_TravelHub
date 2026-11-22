using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin.Access;

/// <summary>A choice of the admin top-bar scope picker; Value is what the API's "scope" parameter takes.</summary>
public sealed record ScopeOptionDto(string Value, string Label, string Kind);

/// <summary>Pure scope logic (no database), so every rule of the permission matrix is unit-tested.</summary>
public static class AdminScopeRules
{
    public const string AllValue = "all";
    private const string RegionPrefix = "region:";
    private const string BranchPrefix = "branch:";

    /// <summary>Null when the user has no active operator role.</summary>
    public static AdminAccess? Resolve(ulong userId, IEnumerable<RoleAssignmentDto> roles,
        IReadOnlyList<BranchRef> branches)
    {
        var view = ScopeSet.None;
        var manage = ScopeSet.None;
        var isAdmin = false;
        foreach (var role in roles.Where(r => RoleCodes.Operators.Contains(r.Code)))
        {
            // An ADMIN row only counts as global; the staff page never creates any other kind.
            if (role.Code == RoleCodes.Admin && role.Scope != RoleScopes.Global) continue;
            var scope = ScopeOf(role, branches);
            view = view.Union(scope);
            if (role.Code != RoleCodes.Staff) manage = manage.Union(scope);
            isAdmin |= role.Code == RoleCodes.Admin;
        }
        return view.IsEmpty ? null : new AdminAccess(userId, isAdmin, view, manage);
    }

    /// <summary>
    /// The branches a list or dashboard should cover. "all" (or nothing) is the user's whole view scope; a region or
    /// branch must lie inside it (403 otherwise). An unknown code is a 400.
    /// </summary>
    public static ScopeSet Select(AdminAccess access, string? raw, IReadOnlyList<BranchRef> branches)
    {
        var value = raw?.Trim();
        if (string.IsNullOrEmpty(value) || value == AllValue) return access.View;
        var requested = value.StartsWith(RegionPrefix, StringComparison.Ordinal)
            ? Branches(branches.Where(b => b.RegionCode == value[RegionPrefix.Length..]))
            : value.StartsWith(BranchPrefix, StringComparison.Ordinal)
                ? Branches(branches.Where(b => b.Code == value[BranchPrefix.Length..]))
                : null;
        if (requested is null || requested.BranchIds.Count == 0)
            throw ApiException.BadRequest("Phạm vi không hợp lệ.");
        if (!access.View.Contains(requested))
            throw ApiException.Forbidden("Phạm vi này nằm ngoài quyền của bạn.");
        return requested;
    }

    /// <summary>"all" first, then every region the user fully covers, then every branch the user covers.</summary>
    public static IReadOnlyList<ScopeOptionDto> Options(AdminAccess access, IReadOnlyList<BranchRef> branches)
    {
        var options = new List<ScopeOptionDto>
        {
            new(AllValue, access.View.IsGlobal ? "Toàn quốc" : "Tất cả phạm vi của tôi", "all"),
        };
        foreach (var region in branches.Where(b => b.RegionCode is not null).GroupBy(b => b.RegionCode!))
        {
            if (access.View.Contains(Branches(region)))
                options.Add(new(RegionPrefix + region.Key, region.First().RegionName ?? region.Key, "region"));
        }
        options.AddRange(branches.Where(b => access.View.Covers(b.Id))
            .Select(b => new ScopeOptionDto(BranchPrefix + b.Code, b.Name, "branch")));
        return options;
    }

    private static ScopeSet ScopeOf(RoleAssignmentDto role, IReadOnlyList<BranchRef> branches) => role.Scope switch
    {
        RoleScopes.Global => ScopeSet.Everything,
        RoleScopes.Region => Branches(branches.Where(b => IdText(b.RegionId) == role.RegionId)),
        RoleScopes.Branch => Branches(branches.Where(b => IdText(b.Id) == role.BranchId)),
        _ => ScopeSet.None,
    };

    private static ScopeSet Branches(IEnumerable<BranchRef> branches) =>
        new(false, branches.Select(b => b.Id).ToHashSet());

    private static string? IdText(ulong? id) =>
        id?.ToString(System.Globalization.CultureInfo.InvariantCulture);
}
