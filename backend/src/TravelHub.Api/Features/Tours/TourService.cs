using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;

namespace TravelHub.Api.Features.Tours;

public sealed class TourService(TourRepository repository, VietnamClock clock)
{
    public Task<IReadOnlyList<TourSummaryDto>> ListAsync(CancellationToken ct) =>
        repository.ListPublishedAsync(clock.Today, ct);

    public async Task<TourDetailDto> GetAsync(string rawId, CancellationToken ct)
    {
        var id = ResourceId.Parse(rawId, "id");
        var today = clock.Today;
        var tour = await repository.FindPublishedAsync(id, today, ct)
            ?? throw ApiException.NotFound("Tour không tồn tại hoặc đã ngừng mở bán.");
        var itinerary = await repository.ListItineraryAsync(id, ct);
        var departures = await repository.ListUpcomingDeparturesAsync(id, today, ct);
        return new TourDetailDto(tour, itinerary, departures.Select(row => ToDto(row, today)).ToList());
    }

    public static bool IsBookable(TourDepartureRow row, DateOnly today) =>
        row.Status == DepartureStatus.Open && row.DepartureDate > today && row.ReservedSeats < row.Capacity;

    private static TourDepartureDto ToDto(TourDepartureRow row, DateOnly today) => new(
        row.Id,
        row.DepartureFrom,
        row.DepartureDate,
        row.ReturnDate,
        row.Capacity,
        Math.Max(0, row.Capacity - row.ReservedSeats),
        row.AdultPrice,
        row.ChildPrice,
        row.Status,
        IsBookable(row, today));
}
