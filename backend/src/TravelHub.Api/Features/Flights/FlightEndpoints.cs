using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Flights;

public static class FlightEndpoints
{
    public static void MapFlightEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/flights", async (string? from, string? to, DateOnly? date, string? cabin,
            FlightService service, CancellationToken ct) =>
        {
            var rows = await service.SearchAsync(new FlightSearchQuery(from, to, date, cabin), ct);
            return Results.Ok(ListResponse<FlightOfferDto>.From(rows));
        }).WithTags("Flights");
    }
}
