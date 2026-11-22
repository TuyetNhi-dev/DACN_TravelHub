using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Configuration;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Tests;

public sealed class AdminScopeRulesTests
{
    // Same organisation as seeds/002: HN (North), DN (Central), HCM and CT (South).
    private static readonly IReadOnlyList<BranchRef> Branches =
    [
        new(1, "HN", "Chi nhánh Hà Nội", 1, "NORTH", "Miền Bắc"),
        new(2, "DN", "Chi nhánh Đà Nẵng", 2, "CENTRAL", "Miền Trung"),
        new(3, "HCM", "Chi nhánh TP.HCM", 3, "SOUTH", "Miền Nam"),
        new(4, "CT", "Chi nhánh Cần Thơ", 3, "SOUTH", "Miền Nam"),
    ];

    private static RoleAssignmentDto Global(string code) => new(code, RoleScopes.Global, null, null);
    private static RoleAssignmentDto Region(string code, string regionId) =>
        new(code, RoleScopes.Region, regionId, null);
    private static RoleAssignmentDto Branch(string code, string branchId) =>
        new(code, RoleScopes.Branch, null, branchId);

    private static AdminAccess Resolve(params RoleAssignmentDto[] roles) =>
        AdminScopeRules.Resolve(7, roles, Branches) ?? throw new InvalidOperationException("no access");

    [Fact]
    public void Customers_and_unknown_roles_get_no_back_office_access()
    {
        Assert.Null(AdminScopeRules.Resolve(7, [new(RoleCodes.Customer, RoleScopes.Self, null, null)], Branches));
        Assert.Null(AdminScopeRules.Resolve(7, [Global("SUPER_ADMIN")], Branches));
        Assert.Null(AdminScopeRules.Resolve(7, [], Branches));
    }

    [Fact]
    public void Staff_see_their_scope_but_manage_nothing()
    {
        var access = Resolve(Branch(RoleCodes.Staff, "3"));
        Assert.True(access.View.Covers(3));
        Assert.False(access.View.Covers(4));
        Assert.False(access.View.Covers(null));
        Assert.False(access.CanManageCatalog);
        Assert.False(access.CanViewAudit);
    }

    [Fact]
    public void A_region_covers_every_branch_in_it()
    {
        var access = Resolve(Region(RoleCodes.BranchManager, "3"));
        Assert.Equal(new ulong[] { 3, 4 }, access.Manage.BranchIds.Order());
        Assert.True(access.CanManageCatalog);
        Assert.False(access.CanManageStaff);
    }

    [Fact]
    public void Several_rows_add_up_and_manage_rights_follow_the_role_of_each_row()
    {
        var access = Resolve(Global(RoleCodes.Staff), Branch(RoleCodes.BranchManager, "1"));
        Assert.True(access.View.IsGlobal);
        Assert.False(access.Manage.IsGlobal);
        Assert.Equal(new ulong[] { 1 }, access.Manage.BranchIds);
    }

    [Fact]
    public void Admin_counts_only_with_global_scope()
    {
        Assert.True(Resolve(Global(RoleCodes.Admin)).IsAdmin);
        Assert.True(Resolve(Global(RoleCodes.Admin)).Manage.Covers(null));
        Assert.Null(AdminScopeRules.Resolve(7, [Branch(RoleCodes.Admin, "1")], Branches));
    }

    [Fact]
    public void Scope_parameter_narrows_inside_the_view_scope()
    {
        var national = Resolve(Global(RoleCodes.Staff));
        Assert.True(AdminScopeRules.Select(national, null, Branches).IsGlobal);
        Assert.True(AdminScopeRules.Select(national, "all", Branches).IsGlobal);
        Assert.Equal(new ulong[] { 3, 4 },
            AdminScopeRules.Select(national, "region:SOUTH", Branches).BranchIds.Order());
        Assert.Equal(new ulong[] { 2 }, AdminScopeRules.Select(national, "branch:DN", Branches).BranchIds);
    }

    [Fact]
    public void Scope_parameter_outside_the_view_scope_is_403_and_unknown_is_400()
    {
        var hanoi = Resolve(Branch(RoleCodes.Staff, "1"));
        Assert.Equal(StatusCodes.Status403Forbidden, Assert.Throws<ApiException>(
            () => AdminScopeRules.Select(hanoi, "branch:HCM", Branches)).StatusCode);
        Assert.Equal(StatusCodes.Status403Forbidden, Assert.Throws<ApiException>(
            () => AdminScopeRules.Select(hanoi, "region:SOUTH", Branches)).StatusCode);
        Assert.Equal(StatusCodes.Status400BadRequest, Assert.Throws<ApiException>(
            () => AdminScopeRules.Select(hanoi, "branch:XYZ", Branches)).StatusCode);
        Assert.Equal(StatusCodes.Status400BadRequest, Assert.Throws<ApiException>(
            () => AdminScopeRules.Select(hanoi, "planet:MARS", Branches)).StatusCode);
    }

    [Fact]
    public void A_branch_only_user_may_still_pick_a_region_made_of_that_single_branch()
    {
        // NORTH has only HN, so the HN staff member fully covers it.
        var hanoi = Resolve(Branch(RoleCodes.Staff, "1"));
        Assert.Equal(new ulong[] { 1 }, AdminScopeRules.Select(hanoi, "region:NORTH", Branches).BranchIds);
    }

    [Fact]
    public void Options_list_all_then_covered_regions_then_branches()
    {
        var south = Resolve(Region(RoleCodes.Staff, "3"));
        var values = AdminScopeRules.Options(south, Branches).Select(o => o.Value).ToList();
        Assert.Equal(["all", "region:SOUTH", "branch:HCM", "branch:CT"], values);
        Assert.Equal("Toàn quốc", AdminScopeRules.Options(Resolve(Global(RoleCodes.Admin)), Branches)[0].Label);
    }

    [Fact]
    public void Scope_sets_intersect_and_contain()
    {
        var south = new ScopeSet(false, new HashSet<ulong> { 3, 4 });
        var hcm = new ScopeSet(false, new HashSet<ulong> { 3 });
        Assert.Equal(new ulong[] { 3 }, south.Intersect(hcm).BranchIds);
        Assert.Same(hcm, ScopeSet.Everything.Intersect(hcm));
        Assert.Same(south, south.Intersect(ScopeSet.Everything));
        Assert.True(south.Contains(hcm));
        Assert.False(hcm.Contains(south));
        Assert.False(south.Contains(ScopeSet.Everything));
    }

    [Fact]
    public async Task Customers_are_refused_before_the_branch_list_is_read()
    {
        var service = new AdminAccessService(new OrganizationRepository(
            new MySqlConnectionFactory(Options.Create(new DatabaseOptions()))));
        var customer = new Account(new AuthUserDto("9", "Khách", "k@example.invalid", null,
            [new RoleAssignmentDto(RoleCodes.Customer, RoleScopes.Self, null, null)]), "hash", null,
            AccountStatus.Active);
        var error = await Assert.ThrowsAsync<ApiException>(
            () => service.RequireAsync(customer, CancellationToken.None));
        Assert.Equal(StatusCodes.Status403Forbidden, error.StatusCode);
    }

    [Fact]
    public void Managing_an_object_of_an_unseen_branch_is_404_and_of_a_seen_one_403()
    {
        var access = Resolve(Global(RoleCodes.Staff), Branch(RoleCodes.BranchManager, "1"));
        AdminAccessService.EnsureCanManage(access, 1, "x");
        Assert.Equal(StatusCodes.Status403Forbidden,
            Assert.Throws<ApiException>(() => AdminAccessService.EnsureCanManage(access, 2, "x")).StatusCode);
        var hanoiOnly = Resolve(Branch(RoleCodes.BranchManager, "1"));
        Assert.Equal(StatusCodes.Status404NotFound,
            Assert.Throws<ApiException>(() => AdminAccessService.EnsureCanManage(hanoiOnly, 2, "x")).StatusCode);
    }
}
