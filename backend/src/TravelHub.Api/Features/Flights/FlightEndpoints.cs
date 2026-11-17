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

        app.MapGet("/api/flights/price-calendar", async (string? from, string? to, string? month, string? cabin,
            FlightService service, CancellationToken ct) =>
        {
            var query = new FlightPriceCalendarQuery(from, to, month, cabin);
            var calendar = await service.GetPriceCalendarAsync(query, ct);
            return Results.Ok(new ItemResponse<FlightPriceCalendarDto>(calendar));
        }).WithTags("Flights");

        app.MapGet("/api/flights/flexible", async (string? from, string? to, DateOnly? date, DateOnly? returnDate,
            string? cabin, FlightService service, CancellationToken ct) =>
        {
            var query = new FlexibleFaresQuery(from, to, date, returnDate, cabin);
            return Results.Ok(new ItemResponse<FlexibleFaresDto>(await service.GetFlexibleFaresAsync(query, ct)));
        }).WithTags("Flights");

        app.MapGet("/api/flights/deals", async (string? from, FlightService service, CancellationToken ct) =>
            Results.Ok(ListResponse<FlightDealDto>.From(await service.ListDealsAsync(from, ct))))
            .WithTags("Flights");
    }
}
