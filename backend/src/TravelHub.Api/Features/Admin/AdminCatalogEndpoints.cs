using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Admin.Context;
using TravelHub.Api.Features.Admin.Dashboard;
using TravelHub.Api.Features.Admin.Departures;
using TravelHub.Api.Features.Admin.Tours;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin;

/// <summary>Context, dashboard, tours, departures and group lists. Thin: services check access and scope.</summary>
public static class AdminCatalogEndpoints
{
    public static void MapAdminCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var admin = app.MapGroup("/api/admin").WithTags("Admin")
            .RequireAuthorization().AddEndpointFilter<AntiforgeryFilter>();

        admin.MapGet("/context", async (HttpContext http, AdminContextService service, CancellationToken ct) =>
            Item(await service.GetAsync(http.GetRequiredAccount(), ct)));
        admin.MapGet("/lookups", async (HttpContext http, AdminContextService service, CancellationToken ct) =>
            Item(await service.LookupsAsync(http.GetRequiredAccount(), ct)));
        admin.MapGet("/dashboard", async (string? scope, HttpContext http, DashboardService service,
            CancellationToken ct) => Item(await service.GetAsync(http.GetRequiredAccount(), scope, ct)));

        MapTours(admin.MapGroup("/tours"));
        MapDepartures(admin.MapGroup("/departures"));
    }

    private static void MapTours(RouteGroupBuilder tours)
    {
        tours.MapGet("/", async ([AsParameters] AdminTourQuery query, HttpContext http, AdminTourService service,
            CancellationToken ct) => Paged(await service.ListAsync(http.GetRequiredAccount(), query, ct)));
        tours.MapGet("/{id}", async (string id, HttpContext http, AdminTourService service, CancellationToken ct) =>
            Item(await service.GetAsync(http.GetRequiredAccount(), id, ct)));
        tours.MapPost("/", async (SaveTourRequest request, HttpContext http, AdminTourService service,
            CancellationToken ct) => Item(await service.CreateAsync(http.GetRequiredAccount(), request, ct)));
        tours.MapPut("/{id}", async (string id, SaveTourRequest request, HttpContext http, AdminTourService service,
            CancellationToken ct) => Item(await service.UpdateAsync(http.GetRequiredAccount(), id, request, ct)));
        tours.MapPost("/{id}/status", async (string id, TourStatusRequest request, HttpContext http,
            AdminTourService service, CancellationToken ct) =>
            Item(await service.SetStatusAsync(http.GetRequiredAccount(), id, request, ct)));
        tours.MapPost("/{id}/clone", async (string id, HttpContext http, AdminTourService service,
            CancellationToken ct) => Item(await service.CloneAsync(http.GetRequiredAccount(), id, ct)));
        tours.MapPut("/{id}/images", async (string id, SaveTourImagesRequest request, HttpContext http,
            AdminTourService service, CancellationToken ct) =>
            Item(await service.SaveImagesAsync(http.GetRequiredAccount(), id, request, ct)));
        tours.MapPut("/{id}/itinerary", async (string id, SaveItineraryRequest request, HttpContext http,
            AdminTourService service, CancellationToken ct) =>
            Item(await service.SaveItineraryAsync(http.GetRequiredAccount(), id, request, ct)));
        tours.MapPut("/{id}/inclusions", async (string id, SaveInclusionsRequest request, HttpContext http,
            AdminTourService service, CancellationToken ct) =>
            Item(await service.SaveInclusionsAsync(http.GetRequiredAccount(), id, request, ct)));
        tours.MapPost("/{id}/departures", async (string id, CreateDepartureRequest request, HttpContext http,
            AdminDepartureService service, CancellationToken ct) =>
            Item(await service.CreateAsync(http.GetRequiredAccount(), id, request, ct)));
        tours.MapPost("/{id}/departures/bulk", async (string id, BulkDeparturesRequest request, HttpContext http,
            AdminDepartureService service, CancellationToken ct) =>
            Item(await service.CreateWeeklyAsync(http.GetRequiredAccount(), id, request, ct)));
    }

    private static void MapDepartures(RouteGroupBuilder departures)
    {
        departures.MapGet("/", async ([AsParameters] AdminDepartureQuery query, HttpContext http,
            AdminDepartureService service, CancellationToken ct) =>
            Paged(await service.ListAsync(http.GetRequiredAccount(), query, ct)));
        departures.MapPut("/{id}", async (string id, UpdateDepartureRequest request, HttpContext http,
            AdminDepartureService service, CancellationToken ct) =>
            Item(await service.UpdateAsync(http.GetRequiredAccount(), id, request, ct)));
        departures.MapPost("/{id}/status", async (string id, DepartureStatusRequest request, HttpContext http,
            AdminDepartureService service, CancellationToken ct) =>
            Item(await service.SetStatusAsync(http.GetRequiredAccount(), id, request, ct)));
        departures.MapGet("/{id}/manifest", async (string id, HttpContext http, ManifestService service,
            CancellationToken ct) => Item(await service.GetAsync(http.GetRequiredAccount(), id, ct)));
        departures.MapGet("/{id}/manifest.xlsx", async (string id, HttpContext http, ManifestService service,
            CancellationToken ct) =>
        {
            var (content, fileName) = await service.ExportAsync(http.GetRequiredAccount(), id, ct);
            return Results.File(content, ManifestExcel.ContentType, fileName);
        });
    }

    private static IResult Item<T>(T data) => Results.Ok(new ItemResponse<T>(data));

    private static IResult Paged<T>((IReadOnlyList<T> Rows, int Total) page) =>
        Results.Ok(ListResponse<T>.Paged(page.Rows, page.Total));
}
