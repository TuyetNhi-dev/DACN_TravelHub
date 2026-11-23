using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Tours;

public static class TourEndpoints
{
    public static void MapTourEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tours").WithTags("Tours");
        // Without page/pageSize the answer is the full (filtered) list, as before; with them it is paged.
        group.MapGet("/", async ([AsParameters] TourSearchQuery query, TourService service, CancellationToken ct) =>
        {
            if (query.Page is null && query.PageSize is null)
                return Results.Ok(ListResponse<TourSummaryDto>.From(await service.ListAsync(query, ct)));
            var page = Math.Max(1, query.Page ?? 1);
            var size = Math.Clamp(query.PageSize ?? 20, 1, 200);
            var (rows, total) = await service.ListPagedAsync(query, page, size, ct);
            return Results.Ok(ListResponse<TourSummaryDto>.Paged(rows, total));
        });
        group.MapGet("/destinations", async (TourService service, CancellationToken ct) =>
            Results.Ok(ListResponse<TourDestinationDto>.From(await service.ListDestinationsAsync(ct))));
        group.MapGet("/departures/upcoming", async (int? days, int? limit, TourService service,
            CancellationToken ct) =>
            Results.Ok(ListResponse<UpcomingDepartureDto>.From(await service.ListDepartingSoonAsync(days, limit, ct))));
        group.MapGet("/{id}", async (string id, TourService service, CancellationToken ct) =>
            Results.Ok(new ItemResponse<TourDetailDto>(await service.GetAsync(id, ct))));

        var collections = app.MapGroup("/api/tour-collections").WithTags("Tours");
        collections.MapGet("/", async (TourCollectionService service, CancellationToken ct) =>
            Results.Ok(ListResponse<TourCollectionDto>.From(await service.ListAsync(ct))));
        collections.MapGet("/{slug}", async (string slug, TourCollectionService service, CancellationToken ct) =>
            Results.Ok(new ItemResponse<TourCollectionDetailDto>(await service.GetAsync(slug, ct))));
    }
}
