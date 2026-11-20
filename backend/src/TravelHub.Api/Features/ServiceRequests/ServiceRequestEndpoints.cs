using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.ServiceRequests;

public static class ServiceRequestEndpoints
{
    /// <summary>Per client IP (see SecurityRegistration: forwarded headers are trusted from loopback only).</summary>
    public const string CreateRateLimitPolicy = "service-request-create";

    public static void MapServiceRequestEndpoints(this IEndpointRouteBuilder app)
    {
        // Anonymous like /api/auth/register, but still CSRF-protected and rate limited.
        var publicGroup = app.MapGroup("/api/service-requests").WithTags("Service requests")
            .AddEndpointFilter<AntiforgeryFilter>();
        publicGroup.MapPost("/", async (CreateServiceRequestRequest request, ServiceRequestService service,
                CancellationToken ct) =>
            {
                var created = await service.CreateAsync(request, ct);
                return Results.Created($"/api/service-requests/{created.Code}",
                    new ItemResponse<ServiceRequestCreatedDto>(created));
            })
            .RequireRateLimiting(CreateRateLimitPolicy);

        var admin = app.MapGroup("/api/admin/service-requests").WithTags("Admin")
            .RequireAuthorization().AddEndpointFilter<AntiforgeryFilter>();
        admin.MapGet("/", async (string? q, string? serviceType, string? status, int? page, int? pageSize,
            HttpContext http, AdminServiceRequestService service, CancellationToken ct) =>
        {
            var (rows, total) = await service.ListAsync(http.GetRequiredAccount(), q, serviceType, status, page,
                pageSize, ct);
            return Results.Ok(ListResponse<ServiceRequestSummaryDto>.Paged(rows, total));
        });
        admin.MapGet("/new-count", async (HttpContext http, AdminServiceRequestService service,
            CancellationToken ct) => Results.Ok(new ItemResponse<ServiceRequestCountDto>(
                await service.CountNewAsync(http.GetRequiredAccount(), ct))));
        admin.MapGet("/{id}", async (string id, HttpContext http, AdminServiceRequestService service,
            CancellationToken ct) => Item(await service.GetAsync(http.GetRequiredAccount(), id, ct)));
        admin.MapPost("/{id}/status", async (string id, UpdateServiceRequestStatusRequest request, HttpContext http,
            AdminServiceRequestService service, CancellationToken ct) =>
            Item(await service.UpdateStatusAsync(http.GetRequiredAccount(), id, request, ct)));
        admin.MapPost("/{id}/notes", async (string id, AddServiceRequestNoteRequest request, HttpContext http,
            AdminServiceRequestService service, CancellationToken ct) =>
            Item(await service.AddNoteAsync(http.GetRequiredAccount(), id, request, ct)));
        admin.MapPost("/{id}/assign-to-me", async (string id, HttpContext http, AdminServiceRequestService service,
            CancellationToken ct) => Item(await service.AssignToMeAsync(http.GetRequiredAccount(), id, ct)));
        admin.MapPost("/{id}/unassign", async (string id, HttpContext http, AdminServiceRequestService service,
            CancellationToken ct) => Item(await service.UnassignAsync(http.GetRequiredAccount(), id, ct)));
    }

    private static IResult Item(ServiceRequestDetailDto detail) =>
        Results.Ok(new ItemResponse<ServiceRequestDetailDto>(detail));
}
