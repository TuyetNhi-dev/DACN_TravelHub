using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Admin;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Admin.Bookings;
using TravelHub.Api.Features.Admin.Context;
using TravelHub.Api.Features.Admin.Dashboard;
using TravelHub.Api.Features.Admin.Departures;
using TravelHub.Api.Features.Admin.Staff;
using TravelHub.Api.Features.Admin.Tours;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.ServiceRequests;

namespace TravelHub.Api.Tests;

/// <summary>
/// Every /api/admin endpoint, called through the real services of the app's container. The branch list is a fixed
/// fake and MySQL is not configured, so any query throws <see cref="Data.DatabaseConfigurationException"/>: a refusal
/// that shows up as ApiException 403 proves the role check runs BEFORE any data is read.
/// </summary>
public sealed class AdminEndpointAuthorizationTests
{
    public enum Need { Operator, Manager, Audit, Admin }

    private delegate Task Call(IServiceProvider services, Account account);

    private const string HanoiBranchId = "1";
    private const string HcmBranchId = "3";
    private static readonly CancellationToken Ct = CancellationToken.None;

    // Same organisation as seeds/002. "Branch A" in these tests is TP.HCM, "branch B" is Hà Nội.
    private static readonly IReadOnlyList<BranchRef> Branches =
    [
        new(1, "HN", "Chi nhánh Hà Nội", 1, "NORTH", "Miền Bắc"),
        new(2, "DN", "Chi nhánh Đà Nẵng", 2, "CENTRAL", "Miền Trung"),
        new(3, "HCM", "Chi nhánh TP.HCM", 3, "SOUTH", "Miền Nam"),
        new(4, "CT", "Chi nhánh Cần Thơ", 3, "SOUTH", "Miền Nam"),
    ];

    private static readonly Account Customer = Person("11", new(RoleCodes.Customer, RoleScopes.Self, null, null));
    private static readonly Account StaffA = Person("12", new(RoleCodes.Staff, RoleScopes.Branch, null, HcmBranchId));
    private static readonly Account ManagerA =
        Person("13", new(RoleCodes.BranchManager, RoleScopes.Branch, null, HcmBranchId));
    private static readonly Account Admin = Person("14", new(RoleCodes.Admin, RoleScopes.Global, null, null));

    private static Account Person(string id, RoleAssignmentDto role) =>
        new(new AuthUserDto(id, "Người thử " + id, $"u{id}@example.invalid", null, [role]), "hash", null,
            AccountStatus.Active);

    private static T Get<T>(IServiceProvider services) where T : notnull => services.GetRequiredService<T>();

    private static readonly SaveTourRequest Tour = new("SH-TEST-01", "Tour kiểm thử", "1", null, HcmBranchId, 3, 2,
        1_000_000m, null);
    private static readonly DepartureTermsInput Terms = new("1", HcmBranchId, 20, 10, 1_000_000m, null);

    /// <summary>Method + route as ASP.NET Core registers it, and the least role the endpoint must demand.</summary>
    private static readonly IReadOnlyDictionary<string, (Need Need, Call Call)> Cases =
        new Dictionary<string, (Need, Call)>
        {
            ["GET /api/admin/context"] = (Need.Operator, (s, a) => Get<AdminContextService>(s).GetAsync(a, Ct)),
            ["GET /api/admin/lookups"] = (Need.Operator, (s, a) => Get<AdminContextService>(s).LookupsAsync(a, Ct)),
            ["GET /api/admin/dashboard"] = (Need.Operator, (s, a) => Get<DashboardService>(s).GetAsync(a, null, Ct)),
            ["GET /api/admin/tours"] = (Need.Operator, (s, a) => Get<AdminTourService>(s).ListAsync(a,
                new AdminTourQuery(null, null, null, null, null), Ct)),
            ["GET /api/admin/tours/{id}"] = (Need.Operator, (s, a) => Get<AdminTourService>(s).GetAsync(a, "1", Ct)),
            ["POST /api/admin/tours"] = (Need.Manager, (s, a) => Get<AdminTourService>(s).CreateAsync(a, Tour, Ct)),
            ["PUT /api/admin/tours/{id}"] = (Need.Manager,
                (s, a) => Get<AdminTourService>(s).UpdateAsync(a, "1", Tour, Ct)),
            ["POST /api/admin/tours/{id}/status"] = (Need.Manager, (s, a) => Get<AdminTourService>(s)
                .SetStatusAsync(a, "1", new TourStatusRequest("paused"), Ct)),
            ["POST /api/admin/tours/{id}/clone"] = (Need.Manager,
                (s, a) => Get<AdminTourService>(s).CloneAsync(a, "1", Ct)),
            ["PUT /api/admin/tours/{id}/images"] = (Need.Manager, (s, a) => Get<AdminTourService>(s)
                .SaveImagesAsync(a, "1", new SaveTourImagesRequest(null), Ct)),
            ["PUT /api/admin/tours/{id}/itinerary"] = (Need.Manager, (s, a) => Get<AdminTourService>(s)
                .SaveItineraryAsync(a, "1", new SaveItineraryRequest(null), Ct)),
            ["PUT /api/admin/tours/{id}/inclusions"] = (Need.Manager, (s, a) => Get<AdminTourService>(s)
                .SaveInclusionsAsync(a, "1", new SaveInclusionsRequest(null), Ct)),
            ["POST /api/admin/tours/{id}/departures"] = (Need.Manager, (s, a) => Get<AdminDepartureService>(s)
                .CreateAsync(a, "1", new CreateDepartureRequest(new DateOnly(2027, 1, 10), "1", HcmBranchId, 20, 10,
                    1_000_000m, null), Ct)),
            ["POST /api/admin/tours/{id}/departures/bulk"] = (Need.Manager, (s, a) => Get<AdminDepartureService>(s)
                .CreateWeeklyAsync(a, "1", new BulkDeparturesRequest(new DateOnly(2027, 1, 1),
                    new DateOnly(2027, 1, 31), [6], "1", HcmBranchId, 20, 10, 1_000_000m, null), Ct)),
            ["GET /api/admin/departures"] = (Need.Operator, (s, a) => Get<AdminDepartureService>(s).ListAsync(a,
                new AdminDepartureQuery(null, null, null, null, null, null, null), Ct)),
            ["PUT /api/admin/departures/{id}"] = (Need.Manager, (s, a) => Get<AdminDepartureService>(s)
                .UpdateAsync(a, "1", new UpdateDepartureRequest(HcmBranchId, 20, 10, 1_000_000m, null), Ct)),
            ["POST /api/admin/departures/{id}/status"] = (Need.Manager, (s, a) => Get<AdminDepartureService>(s)
                .SetStatusAsync(a, "1", new DepartureStatusRequest(DepartureStatus.Closed), Ct)),
            ["GET /api/admin/departures/{id}/manifest"] = (Need.Operator,
                (s, a) => Get<ManifestService>(s).GetAsync(a, "1", Ct)),
            ["GET /api/admin/departures/{id}/manifest.xlsx"] = (Need.Operator,
                (s, a) => Get<ManifestService>(s).ExportAsync(a, "1", Ct)),
            ["GET /api/admin/bookings"] = (Need.Operator, (s, a) => Get<AdminBookingService>(s).ListAsync(a,
                new AdminBookingQuery(null, null, null), Ct)),
            ["GET /api/admin/bookings/{id}"] = (Need.Operator,
                (s, a) => Get<AdminBookingService>(s).GetAsync(a, "1", Ct)),
            ["POST /api/admin/bookings/{id}/confirm"] = (Need.Operator, (s, a) => Get<AdminBookingService>(s)
                .ConfirmAsync(a, "1", new ConfirmBookingRequest("ABC123"), Ct)),
            ["POST /api/admin/bookings/{id}/reject"] = (Need.Operator,
                (s, a) => Get<AdminBookingService>(s).RejectAsync(a, "1", Ct)),
            ["POST /api/admin/bookings/{id}/complete"] = (Need.Operator,
                (s, a) => Get<AdminBookingService>(s).CompleteAsync(a, "1", Ct)),
            ["POST /api/admin/bookings/{id}/cancel"] = (Need.Operator,
                (s, a) => Get<AdminBookingService>(s).CancelAsync(a, "1", Ct)),
            ["GET /api/admin/bookings/{id}/activity"] = (Need.Operator,
                (s, a) => Get<BookingActivityService>(s).GetAsync(a, "1", Ct)),
            ["POST /api/admin/bookings/{id}/notes"] = (Need.Operator, (s, a) => Get<BookingActivityService>(s)
                .AddNoteAsync(a, "1", new BookingNoteRequest("Khách hẹn gọi lại"), Ct)),
            ["GET /api/admin/service-requests"] = (Need.Operator, (s, a) => Get<AdminServiceRequestService>(s)
                .ListAsync(a, null, null, null, null, null, Ct)),
            ["GET /api/admin/service-requests/new-count"] = (Need.Operator,
                (s, a) => Get<AdminServiceRequestService>(s).CountNewAsync(a, Ct)),
            ["GET /api/admin/service-requests/{id}"] = (Need.Operator,
                (s, a) => Get<AdminServiceRequestService>(s).GetAsync(a, "1", Ct)),
            ["POST /api/admin/service-requests/{id}/status"] = (Need.Operator, (s, a) =>
                Get<AdminServiceRequestService>(s).UpdateStatusAsync(a, "1",
                    new UpdateServiceRequestStatusRequest("contacted"), Ct)),
            ["POST /api/admin/service-requests/{id}/notes"] = (Need.Operator, (s, a) =>
                Get<AdminServiceRequestService>(s).AddNoteAsync(a, "1", new AddServiceRequestNoteRequest("Đã gọi"),
                    Ct)),
            ["POST /api/admin/service-requests/{id}/assign-to-me"] = (Need.Operator,
                (s, a) => Get<AdminServiceRequestService>(s).AssignToMeAsync(a, "1", Ct)),
            ["POST /api/admin/service-requests/{id}/unassign"] = (Need.Operator,
                (s, a) => Get<AdminServiceRequestService>(s).UnassignAsync(a, "1", Ct)),
            ["GET /api/admin/audit-logs"] = (Need.Audit, (s, a) => Get<AuditLogService>(s).ListAsync(a,
                new AuditLogQuery(null, null, null, null, null, null, null), Ct)),
            ["GET /api/admin/audit-logs/actors"] = (Need.Audit,
                (s, a) => Get<AuditLogService>(s).ActorsAsync(a, null, Ct)),
            ["GET /api/admin/staff"] = (Need.Admin, (s, a) => Get<StaffService>(s).ListAsync(a, Ct)),
            ["POST /api/admin/staff/assignments"] = (Need.Admin, (s, a) => Get<StaffService>(s).AssignAsync(a,
                new AssignStaffRequest("nv@example.invalid", RoleCodes.Staff, RoleScopes.Global, null, null), Ct)),
            ["POST /api/admin/staff/assignments/{id}/deactivate"] = (Need.Admin,
                (s, a) => Get<StaffService>(s).RevokeAsync(a, "1", Ct)),
            ["POST /api/admin/staff/users/{userId}/lock"] = (Need.Admin,
                (s, a) => Get<StaffService>(s).SetLockedAsync(a, "99", locked: true, Ct)),
            ["POST /api/admin/staff/users/{userId}/unlock"] = (Need.Admin,
                (s, a) => Get<StaffService>(s).SetLockedAsync(a, "99", locked: false, Ct)),
        };

    public static TheoryData<string> Routes => [.. Cases.Keys];

    /// <summary>Lists the admin routes the API really maps, so a new endpoint without a case here fails.</summary>
    [Fact]
    public void Every_mapped_admin_route_has_an_authorization_case()
    {
        var app = Builder().Build();
        app.MapTravelHubEndpoints();
        var mapped = ((IEndpointRouteBuilder)app).DataSources.SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>()
            .Where(e => e.RoutePattern.RawText?.StartsWith("/api/admin", StringComparison.Ordinal) == true)
            .SelectMany(e => (e.Metadata.GetMetadata<IHttpMethodMetadata>()?.HttpMethods ?? [])
                .Select(method => $"{method} {e.RoutePattern.RawText!.TrimEnd('/')}"))
            .ToHashSet();
        Assert.Empty(mapped.Except(Cases.Keys));
        Assert.Empty(Cases.Keys.Except(mapped));
    }

    [Theory]
    [MemberData(nameof(Routes))]
    public async Task Customers_are_refused_on_every_admin_route(string route) =>
        await AssertForbidden(route, Customer);

    [Theory]
    [MemberData(nameof(Routes))]
    public async Task Branch_staff_are_refused_where_a_manager_or_admin_is_needed(string route)
    {
        if (Cases[route].Need == Need.Operator) await AssertAllowedRole(StaffA, Need.Operator);
        else await AssertForbidden(route, StaffA);
    }

    [Theory]
    [MemberData(nameof(Routes))]
    public async Task Branch_managers_are_refused_only_on_admin_routes(string route)
    {
        if (Cases[route].Need == Need.Admin) await AssertForbidden(route, ManagerA);
        else await AssertAllowedRole(ManagerA, Cases[route].Need);
    }

    [Theory]
    [MemberData(nameof(Routes))]
    public async Task Admins_pass_the_role_check_of_every_route(string route) =>
        await AssertAllowedRole(Admin, Cases[route].Need);

    [Fact]
    public async Task Staff_of_branch_A_cannot_ask_for_branch_B_on_any_list()
    {
        using var scope = Services().CreateScope();
        var s = scope.ServiceProvider;
        Call[] lists =
        [
            (sp, a) => Get<DashboardService>(sp).GetAsync(a, "branch:HN", Ct),
            (sp, a) => Get<AdminTourService>(sp).ListAsync(a, new AdminTourQuery("branch:HN", null, null, null, null),
                Ct),
            (sp, a) => Get<AdminDepartureService>(sp).ListAsync(a,
                new AdminDepartureQuery("branch:HN", null, null, null, null, null, null), Ct),
            (sp, a) => Get<AdminBookingService>(sp).ListAsync(a, new AdminBookingQuery(null, null, "region:NORTH"),
                Ct),
        ];
        foreach (var list in lists)
            Assert.Equal(StatusCodes.Status403Forbidden,
                (await Assert.ThrowsAsync<ApiException>(() => list(s, StaffA))).StatusCode);
    }

    [Fact]
    public async Task Objects_of_branch_B_do_not_exist_for_staff_of_branch_A_and_cannot_be_assigned_by_its_manager()
    {
        using var scope = Services().CreateScope();
        var access = Get<AdminAccessService>(scope.ServiceProvider);
        var staff = await access.RequireAsync(StaffA, Ct);
        Assert.False(staff.View.Covers(1));
        Assert.Equal(StatusCodes.Status404NotFound,
            Assert.Throws<ApiException>(() => AdminAccessService.EnsureCanManage(staff, 1, "x")).StatusCode);
        var manager = await access.RequireAsync(ManagerA, Ct);
        AdminAccessService.EnsureCanManage(manager, 3, "x");
        await Assert.ThrowsAsync<ApiValidationException>(() => access.RequireManagedBranchAsync(manager, 1, Ct));
        Assert.Equal(StatusCodes.Status403Forbidden, (await Assert.ThrowsAsync<ApiException>(() =>
            Get<AuditLogService>(scope.ServiceProvider).ListAsync(ManagerA,
                new AuditLogQuery("branch:HN", null, null, null, null, null, null), Ct))).StatusCode);
    }

    [Fact]
    public async Task Audit_rows_carry_the_region_of_the_changed_object()
    {
        using var scope = Services().CreateScope();
        var access = Get<AdminAccessService>(scope.ServiceProvider);
        var manager = await access.RequireManagerAsync(ManagerA, Ct);
        var entry = await access.AuditAsync(manager, AuditActions.DepartureStatus, AuditEntities.Departure, "5", 3,
            "Chốt đoàn", [new AuditChange("status", "open", "guaranteed")], Ct);
        Assert.Equal((13UL, 3UL, 3UL), (entry.ActorId, entry.BranchId!.Value, entry.RegionId!.Value));
        Assert.Equal("departure.status", entry.Action);
    }

    private static async Task AssertForbidden(string route, Account account)
    {
        using var scope = Services().CreateScope();
        var error = await Assert.ThrowsAsync<ApiException>(() => Cases[route].Call(scope.ServiceProvider, account));
        Assert.Equal(StatusCodes.Status403Forbidden, error.StatusCode);
    }

    /// <summary>The role check of <paramref name="need"/> lets the account through (the data part needs MySQL).</summary>
    private static async Task AssertAllowedRole(Account account, Need need)
    {
        using var scope = Services().CreateScope();
        var access = Get<AdminAccessService>(scope.ServiceProvider);
        var granted = need switch
        {
            Need.Operator => await access.RequireAsync(account, Ct),
            Need.Manager => await access.RequireManagerAsync(account, Ct),
            Need.Admin => await access.RequireAdminAsync(account, Ct),
            _ => await access.RequireAsync(account, Ct),
        };
        if (need == Need.Audit) Assert.True(granted.CanViewAudit);
    }

    private static WebApplicationBuilder Builder()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = Environments.Development,
            ApplicationName = typeof(ServiceRegistration).Assembly.GetName().Name,
        });
        builder.Configuration.Sources.Clear();
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>());
        builder.Services.AddTravelHubServices(builder.Configuration);
        builder.Services.AddTravelHubSecurity(builder.Environment);
        builder.Services.AddScoped<IBranchDirectory>(_ => new FixedBranches());
        return builder;
    }

    private static ServiceProvider Services() => Builder().Services.BuildServiceProvider();

    private sealed class FixedBranches : IBranchDirectory
    {
        public Task<IReadOnlyList<BranchRef>> ListBranchesAsync(CancellationToken ct) => Task.FromResult(Branches);
    }
}
