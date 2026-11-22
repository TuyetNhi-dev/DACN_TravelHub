namespace TravelHub.Api.Features.Admin.Access;

/// <summary>A branch with its region, as the back office shows and filters it.</summary>
public sealed record BranchRef(ulong Id, string Code, string Name, ulong? RegionId, string? RegionCode,
    string? RegionName);

/// <summary>
/// A set of branches. Global means every branch AND the objects that belong to none (online hotel and flight
/// orders, service requests); a non-global set never covers those.
/// </summary>
public sealed record ScopeSet(bool IsGlobal, IReadOnlySet<ulong> BranchIds)
{
    public static readonly ScopeSet None = new(false, new HashSet<ulong>());
    public static readonly ScopeSet Everything = new(true, new HashSet<ulong>());

    public bool IsEmpty => !IsGlobal && BranchIds.Count == 0;

    public bool Covers(ulong? branchId) => IsGlobal || (branchId is not null && BranchIds.Contains(branchId.Value));

    public bool Contains(ScopeSet other) =>
        IsGlobal || (!other.IsGlobal && other.BranchIds.All(BranchIds.Contains));

    public ScopeSet Union(ScopeSet other) => IsGlobal || other.IsGlobal
        ? Everything
        : new ScopeSet(false, BranchIds.Union(other.BranchIds).ToHashSet());

    public ScopeSet Intersect(ScopeSet other) => IsGlobal
        ? other
        : other.IsGlobal ? this : new ScopeSet(false, BranchIds.Where(other.BranchIds.Contains).ToHashSet());
}

/// <summary>
/// What a signed-in operator may see (<see cref="View"/>: every operator role) and change in the catalogue
/// (<see cref="Manage"/>: BRANCH_MANAGER and ADMIN rows only). Built from the role rows read from MySQL on every
/// request, so a revoked assignment takes effect immediately.
/// </summary>
public sealed record AdminAccess(ulong UserId, bool IsAdmin, ScopeSet View, ScopeSet Manage)
{
    public bool CanManageCatalog => !Manage.IsEmpty;
    public bool CanViewAudit => !Manage.IsEmpty;
    public bool CanManageStaff => IsAdmin;
}
