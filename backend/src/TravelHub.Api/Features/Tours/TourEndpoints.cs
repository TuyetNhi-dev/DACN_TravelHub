using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Tours;

public static class TourEndpoints
{
    public static void MapTourEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tours").WithTags("Tours");
        group.MapGet("/", async (int? page, int? pageSize, string? region, TourService service,
            CancellationToken ct) =>
        {
            if (page is null && pageSize is null)
                return Results.Ok(ListResponse<TourSummaryDto>.From(await service.ListAsync(region, ct)));
            var p = Math.Max(1, page ?? 1);
            var size = Math.Clamp(pageSize ?? 20, 1, 200);
            var (rows, total) = await service.ListPagedAsync(p, size, region, ct);
            return Results.Ok(ListResponse<TourSummaryDto>.Paged(rows, total));
        });
        group.MapGet("/{id}", async (string id, TourService service, CancellationToken ct) =>
            Results.Ok(new ItemResponse<TourDetailDto>(await service.GetAsync(id, ct))));

        var collections = app.MapGroup("/api/tour-collections").WithTags("Tours");
        collections.MapGet("/", async (TourCollectionService service, CancellationToken ct) =>
            Results.Ok(ListResponse<TourCollectionDto>.From(await service.ListAsync(ct))));
        collections.MapGet("/{slug}", async (string slug, TourCollectionService service, CancellationToken ct) =>
            Results.Ok(new ItemResponse<TourCollectionDetailDto>(await service.GetAsync(slug, ct))));
    }
}
