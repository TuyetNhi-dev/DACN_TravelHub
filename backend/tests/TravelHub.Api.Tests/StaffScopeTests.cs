using TravelHub.Api.Features.Admin;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Tests;

public sealed class StaffScopeTests
{
    private static AuthUserDto User(params RoleAssignmentDto[] roles) => new("7", "Nhân viên", "nv@example.invalid",
        null, roles);

    private static RoleAssignmentDto Role(string code, string scope) => new(code, scope, null, null);

    [Fact]
    public void Customers_have_no_back_office_access()
    {
        Assert.Null(StaffScope.From(User(Role(RoleCodes.Customer, RoleScopes.Self))));
        Assert.Null(StaffScope.From(User()));
    }

    [Theory]
    [InlineData(RoleCodes.Staff, false)]
    [InlineData(RoleCodes.Admin, true)]
    public void Staff_and_admins_with_global_scope_get_access(string code, bool isAdmin)
    {
        var scope = StaffScope.From(User(Role(code, RoleScopes.Global)));

        Assert.NotNull(scope);
        Assert.Equal(isAdmin, scope.IsAdmin);
    }

    [Fact]
    public void Operator_roles_without_global_scope_are_ignored()
    {
        Assert.Null(StaffScope.From(User(Role(RoleCodes.Staff, RoleScopes.Self))));
    }

    [Fact]
    public void Old_five_role_codes_no_longer_grant_access()
    {
        Assert.Null(StaffScope.From(User(Role("SUPER_ADMIN", RoleScopes.Global))));
        Assert.Null(StaffScope.From(User(Role("BRANCH_MANAGER", RoleScopes.Global))));
    }

    [Fact]
    public void Only_three_role_codes_exist()
    {
        Assert.Equal(new[] { RoleCodes.Admin, RoleCodes.Staff }, RoleCodes.Operators.Order());
        Assert.Equal("CUSTOMER", RoleCodes.Customer);
    }
}
