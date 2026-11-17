using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Tours;

public static class TourEndpoints
{
    public static void MapTourEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tours").WithTags("Tours");
        group.MapGet("/", async (TourService service, CancellationToken ct) =>
            Results.Ok(ListResponse<TourSummaryDto>.From(await service.ListAsync(ct))));
        group.MapGet("/{id}", async (string id, TourService service, CancellationToken ct) =>
            Results.Ok(new ItemResponse<TourDetailDto>(await service.GetAsync(id, ct))));

        var collections = app.MapGroup("/api/tour-collections").WithTags("Tours");
        collections.MapGet("/", async (TourCollectionService service, CancellationToken ct) =>
            Results.Ok(ListResponse<TourCollectionDto>.From(await service.ListAsync(ct))));
        collections.MapGet("/{slug}", async (string slug, TourCollectionService service, CancellationToken ct) =>
            Results.Ok(new ItemResponse<TourCollectionDetailDto>(await service.GetAsync(slug, ct))));
    }
}
