namespace TravelHub.Api.Features.Tours;

public sealed record TourSummaryDto(
    string Id,
    string Code,
    string Title,
    string Destination,
    string? DepartureFrom,
    int DurationDays,
    int DurationNights,
    string? Transport,
    decimal BasePrice,
    string? Description,
    IReadOnlyList<DateOnly> UpcomingDepartureDates);

public sealed record ItineraryDayDto(int DayNumber, string Title, string? Description);

public sealed record TourDepartureDto(
    string Id,
    string DepartureFrom,
    DateOnly DepartureDate,
    DateOnly ReturnDate,
    int Capacity,
    int AvailableSeats,
    decimal AdultPrice,
    decimal? ChildPrice,
    string Status,
    bool IsBookable);

/// <summary>A tour photo; the first one of <see cref="TourDetailDto.Images"/> is the cover.</summary>
public sealed record TourImageDto(string Url, string? Alt);

/// <summary>"Giá tour bao gồm" and "Không bao gồm" lines, each in display order.</summary>
public sealed record TourInclusionsDto(IReadOnlyList<string> Included, IReadOnlyList<string> Excluded);

public sealed record TourDetailDto(
    TourSummaryDto Tour,
    IReadOnlyList<ItineraryDayDto> Itinerary,
    IReadOnlyList<TourDepartureDto> Departures,
    IReadOnlyList<TourImageDto> Images,
    TourInclusionsDto Inclusions);

/// <summary>Raw tour_images row.</summary>
public sealed record TourImageRow(string Url, string? Alt, int SortOrder);

/// <summary>Raw tour_inclusions row.</summary>
public sealed record TourInclusionRow(string Description, bool IsIncluded);

/// <summary>Raw departure row; bookability is a business rule decided by the service.</summary>
public sealed record TourDepartureRow(
    string Id,
    string DepartureFrom,
    DateOnly DepartureDate,
    DateOnly ReturnDate,
    int Capacity,
    int ReservedSeats,
    decimal AdultPrice,
    decimal? ChildPrice,
    string Status);

public static class DepartureStatus
{
    public const string Open = "open";
    public const string Closed = "closed";
    public const string Cancelled = "cancelled";
}
