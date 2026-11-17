using System.Globalization;
using System.Text;
using MySqlConnector;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin;

/// <summary>
/// Which orders an operator may see. Tour orders belong to the tour's operating branch. Online hotel/flight
/// orders have no selling branch and form a shared queue visible to every operator.
/// </summary>
public sealed record StaffScope(bool IsGlobal, IReadOnlyList<ulong> RegionIds, IReadOnlyList<ulong> BranchIds)
{
    public static StaffScope? From(AuthUserDto user)
    {
        var assignments = user.Roles.Where(role => RoleCodes.Operators.Contains(role.Code)).ToList();
        if (assignments.Count == 0) return null;
        var isGlobal = assignments.Any(role => role.Code == RoleCodes.SuperAdmin && role.Scope == RoleScopes.Global);
        return new StaffScope(isGlobal, Ids(assignments, role => role.RegionId), Ids(assignments, role => role.BranchId));
    }

    public bool Covers(ulong? branchId, ulong? branchRegionId) =>
        IsGlobal || branchId is null || BranchIds.Contains(branchId.Value)
        || (branchRegionId is { } region && RegionIds.Contains(region));

    /// <summary>Appends a parameterised filter on the given branch column; ids are bound, never concatenated.</summary>
    public void AppendFilter(StringBuilder sql, MySqlCommand command, string branchColumn)
    {
        if (IsGlobal) return;
        sql.Append(" AND (").Append(branchColumn).Append(" IS NULL");
        AppendIn(sql, command, branchColumn, "@scopeBranch", BranchIds);
        if (RegionIds.Count > 0)
        {
            sql.Append(" OR ").Append(branchColumn).Append(" IN (SELECT id FROM branches WHERE region_id");
            AppendList(sql, command, "@scopeRegion", RegionIds);
            sql.Append(')');
        }
        sql.Append(')');
    }

    private static void AppendIn(StringBuilder sql, MySqlCommand command, string column, string prefix,
        IReadOnlyList<ulong> ids)
    {
        if (ids.Count == 0) return;
        sql.Append(" OR ").Append(column);
        AppendList(sql, command, prefix, ids);
    }

    private static void AppendList(StringBuilder sql, MySqlCommand command, string prefix, IReadOnlyList<ulong> ids)
    {
        var names = ids.Select((id, index) =>
        {
            var name = prefix + index.ToString(CultureInfo.InvariantCulture);
            command.Parameters.AddWithValue(name, id);
            return name;
        });
        sql.Append(" IN (").Append(string.Join(", ", names)).Append(')');
    }

    private static List<ulong> Ids(IEnumerable<RoleAssignmentDto> roles, Func<RoleAssignmentDto, string?> pick) =>
        roles.Select(pick).OfType<string>()
            .Select(id => ulong.Parse(id, CultureInfo.InvariantCulture)).Distinct().ToList();
}
