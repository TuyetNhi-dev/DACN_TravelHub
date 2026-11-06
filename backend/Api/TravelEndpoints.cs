using TravelHub.Api.Data;
using TravelHub.Api.Models;

namespace TravelHub.Api.Api;

public static class TravelEndpoints
{
    public static void MapTravelEndpoints(this WebApplication app)
    {
        var api = app.MapGroup("/api");
        api.MapGet("/tours", async (TravelRepository repo, CancellationToken ct) =>
        {
            var rows = await repo.GetToursAsync(ct);
            return Results.Ok(new ListResponse<Tour>(rows, rows.Count));
        });
        api.MapGet("/tours/{id}", async Task<IResult> (string id, TravelRepository repo, CancellationToken ct) =>
        {
            if (!ValidId(id)) return InvalidId();
            var detail = await repo.GetTourAsync(id, ct);
            return detail is null ? Missing("Tour") : Results.Ok(new ItemResponse<TourDetail>(detail));
        });
        api.MapGet("/hotels", async (TravelRepository repo, CancellationToken ct) =>
        {
            var rows = await repo.GetHotelsAsync(ct);
            return Results.Ok(new ListResponse<Hotel>(rows, rows.Count));
        });
        api.MapGet("/hotels/{id}", async Task<IResult> (string id, TravelRepository repo, CancellationToken ct) =>
        {
            if (!ValidId(id)) return InvalidId();
            var detail = await repo.GetHotelAsync(id, ct);
            return detail is null ? Missing("Hotel") : Results.Ok(new ItemResponse<HotelDetail>(detail));
        });
        api.MapGet("/flights", async (TravelRepository repo, CancellationToken ct) =>
        {
            var rows = await repo.GetFlightsAsync(ct);
            return Results.Ok(new ListResponse<Flight>(rows, rows.Count));
        });
        api.MapGet("/health/database", async Task<IResult> (TravelRepository repo, CancellationToken ct) =>
        {
            var database = await repo.CheckDatabaseAsync(ct);
            return !string.IsNullOrEmpty(database)
                ? Results.Ok(new { status = "ok", database })
                : Results.Problem(statusCode: 503, title: "Database unavailable");
        });
    }

    private static bool ValidId(string id) =>
        ulong.TryParse(id, System.Globalization.NumberStyles.None,
            System.Globalization.CultureInfo.InvariantCulture, out var value) && value > 0;
    private static IResult InvalidId() => Results.Problem(statusCode: 400,
        title: "Invalid ID", detail: "ID must be a positive unsigned 64-bit integer.");
    private static IResult Missing(string resource) => Results.Problem(statusCode: 404,
        title: "Not found", detail: $"{resource} không tồn tại.");
}
