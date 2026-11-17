using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Hotels;

public static class HotelEndpoints
{
    public static void MapHotelEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/hotels").WithTags("Hotels");
        group.MapGet("/", async (HotelService service, CancellationToken ct) =>
            Results.Ok(ListResponse<HotelSummaryDto>.From(await service.ListAsync(ct))));
        group.MapGet("/{id}", async (string id, HotelService service, CancellationToken ct) =>
            Results.Ok(new ItemResponse<HotelDetailDto>(await service.GetAsync(id, ct))));
    }
}
