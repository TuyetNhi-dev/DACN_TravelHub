using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;

namespace TravelHub.Api.Features.Tours;

public sealed class TourService(TourRepository repository, VietnamClock clock)
{
    public Task<IReadOnlyList<TourSummaryDto>> ListAsync(CancellationToken ct) =>
        repository.ListPublishedAsync(clock.Today, ct);

    public async Task<(IReadOnlyList<TourSummaryDto> Rows, int Total)> ListPagedAsync(
        int page, int pageSize, CancellationToken ct)
    {
        var total = await repository.CountPublishedAsync(ct);
        var rows = await repository.ListPublishedPagedAsync(clock.Today, (page - 1) * pageSize, pageSize, ct);
        return (rows, total);
    }

    public async Task<TourDetailDto> GetAsync(string rawId, CancellationToken ct)
    {
        var id = ResourceId.Parse(rawId, "id");
        var today = clock.Today;
        var tour = await repository.FindPublishedAsync(id, today, ct)
            ?? throw ApiException.NotFound("Tour không tồn tại hoặc đã ngừng mở bán.");
        var itinerary = await repository.ListItineraryAsync(id, ct);
        var departures = await repository.ListUpcomingDeparturesAsync(id, today, ct);
        var images = await repository.ListImagesAsync(id, ct);
        var inclusions = await repository.ListInclusionsAsync(id, ct);
        return new TourDetailDto(tour, itinerary, departures.Select(row => ToDto(row, today)).ToList(),
            ToImages(images), ToInclusions(inclusions));
    }

    /// <summary>
    /// Cover first. Only absolute https URLs leave the API: the page renders them directly, so a typo or an
    /// http/relative path in the table must not become a broken or mixed-content image.
    /// </summary>
    public static IReadOnlyList<TourImageDto> ToImages(IEnumerable<TourImageRow> rows) => rows
        .OrderBy(row => row.SortOrder)
        .Where(row => Uri.TryCreate(row.Url.Trim(), UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps)
        .Select(row => new TourImageDto(row.Url.Trim(), string.IsNullOrWhiteSpace(row.Alt) ? null : row.Alt.Trim()))
        .ToList();

    public static TourInclusionsDto ToInclusions(IReadOnlyList<TourInclusionRow> rows)
    {
        static List<string> Pick(IEnumerable<TourInclusionRow> lines, bool included) => lines
            .Where(line => line.IsIncluded == included && !string.IsNullOrWhiteSpace(line.Description))
            .Select(line => line.Description.Trim())
            .ToList();
        return new TourInclusionsDto(Pick(rows, true), Pick(rows, false));
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
