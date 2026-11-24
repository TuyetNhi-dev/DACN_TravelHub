using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Admin.Staff;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin;

/// <summary>"Hệ thống": audit log (managers, admins) and staff roles (admins).</summary>
public static class AdminSystemEndpoints
{
    public static void MapAdminSystemEndpoints(this IEndpointRouteBuilder app)
    {
        var admin = app.MapGroup("/api/admin").WithTags("Admin")
            .RequireAuthorization().AddEndpointFilter<AntiforgeryFilter>();

        admin.MapGet("/audit-logs", async ([AsParameters] AuditLogQuery query, HttpContext http,
            AuditLogService service, CancellationToken ct) =>
        {
            var (rows, total) = await service.ListAsync(http.GetRequiredAccount(), query, ct);
            return Results.Ok(ListResponse<AuditLogDto>.Paged(rows, total));
        });

        admin.MapGet("/audit-logs/actors", async (string? scope, HttpContext http, AuditLogService service,
            CancellationToken ct) => Results.Ok(ListResponse<AuditActorDto>.From(
                await service.ActorsAsync(http.GetRequiredAccount(), scope, ct))));

        admin.MapGet("/staff", async (HttpContext http, StaffService service, CancellationToken ct) =>
            Results.Ok(ListResponse<StaffMemberDto>.From(await service.ListAsync(http.GetRequiredAccount(), ct))));
        admin.MapPost("/staff/assignments", async (AssignStaffRequest request, HttpContext http,
            StaffService service, CancellationToken ct) =>
            Results.Ok(ListResponse<StaffMemberDto>.From(
                await service.AssignAsync(http.GetRequiredAccount(), request, ct))));
        admin.MapPost("/staff/assignments/{id}/deactivate", async (string id, HttpContext http,
            StaffService service, CancellationToken ct) =>
            Results.Ok(ListResponse<StaffMemberDto>.From(
                await service.RevokeAsync(http.GetRequiredAccount(), id, ct))));
        admin.MapPost("/staff/users/{userId}/lock", async (string userId, HttpContext http, StaffService service,
            CancellationToken ct) => Results.Ok(ListResponse<StaffMemberDto>.From(
                await service.SetLockedAsync(http.GetRequiredAccount(), userId, locked: true, ct))));
        admin.MapPost("/staff/users/{userId}/unlock", async (string userId, HttpContext http, StaffService service,
            CancellationToken ct) => Results.Ok(ListResponse<StaffMemberDto>.From(
                await service.SetLockedAsync(http.GetRequiredAccount(), userId, locked: false, ct))));
    }
}
