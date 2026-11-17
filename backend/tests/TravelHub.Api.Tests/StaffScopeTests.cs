using System.Text;
using MySqlConnector;
using TravelHub.Api.Features.Admin;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Tests;

public sealed class StaffScopeTests
{
    private static AuthUserDto User(params RoleAssignmentDto[] roles) => new("7", "Nhân viên", "nv@example.invalid",
        null, roles);

    [Fact]
    public void Customers_have_no_operator_scope()
    {
        Assert.Null(StaffScope.From(User(new RoleAssignmentDto(RoleCodes.Customer, RoleScopes.Self, null, null))));
    }

    [Fact]
    public void Branch_staff_see_their_branch_and_the_shared_online_queue_only()
    {
        var scope = StaffScope.From(User(new RoleAssignmentDto(RoleCodes.Staff, RoleScopes.Branch, null, "3")))!;

        Assert.True(scope.Covers(branchId: 3, branchRegionId: 3));
        Assert.True(scope.Covers(branchId: null, branchRegionId: null));
        Assert.False(scope.Covers(branchId: 1, branchRegionId: 1));
    }

    [Fact]
    public void Regional_managers_see_every_branch_in_their_region()
    {
        var scope = StaffScope.From(User(
            new RoleAssignmentDto(RoleCodes.RegionalManager, RoleScopes.Region, "3", null)))!;

        Assert.True(scope.Covers(branchId: 4, branchRegionId: 3));
        Assert.False(scope.Covers(branchId: 1, branchRegionId: 1));
    }

    [Fact]
    public void Super_admin_adds_no_sql_filter()
    {
        var scope = StaffScope.From(User(new RoleAssignmentDto(RoleCodes.SuperAdmin, RoleScopes.Global, null, null)))!;
        var sql = new StringBuilder();

        scope.AppendFilter(sql, new MySqlCommand(), "b.selling_branch_id");

        Assert.True(scope.IsGlobal);
        Assert.Equal("", sql.ToString());
    }

    [Fact]
    public void Scoped_filter_binds_ids_as_parameters()
    {
        var scope = StaffScope.From(User(
            new RoleAssignmentDto(RoleCodes.BranchManager, RoleScopes.Branch, null, "2"),
            new RoleAssignmentDto(RoleCodes.RegionalManager, RoleScopes.Region, "1", null)))!;
        var sql = new StringBuilder();
        var command = new MySqlCommand();

        scope.AppendFilter(sql, command, "b.selling_branch_id");

        Assert.Equal(" AND (b.selling_branch_id IS NULL OR b.selling_branch_id IN (@scopeBranch0)"
            + " OR b.selling_branch_id IN (SELECT id FROM branches WHERE region_id IN (@scopeRegion0)))",
            sql.ToString());
        Assert.Equal(2, command.Parameters.Count);
    }
}
