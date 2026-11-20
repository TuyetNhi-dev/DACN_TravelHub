using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Hotels;

public static class HotelEndpoints
{
    public static void MapHotelEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/hotels").WithTags("Hotels");
        group.MapGet("/", async (int? page, int? pageSize, HotelService service, CancellationToken ct) =>
        {
            if (page is null && pageSize is null)
                return Results.Ok(ListResponse<HotelSummaryDto>.From(await service.ListAsync(ct)));
            var p = Math.Max(1, page ?? 1);
            var size = Math.Clamp(pageSize ?? 12, 1, 100);
            var (rows, total) = await service.ListPagedAsync(p, size, ct);
            return Results.Ok(ListResponse<HotelSummaryDto>.Paged(rows, total));
        });
        group.MapGet("/{id}", async (string id, HotelService service, CancellationToken ct) =>
            Results.Ok(new ItemResponse<HotelDetailDto>(await service.GetAsync(id, ct))));
    }
}
