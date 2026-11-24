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
    IReadOnlyList<DateOnly> UpcomingDepartureDates,
    /// <summary>Region codes (NORTH, CENTRAL, SOUTH) of the branches running its open future departures.</summary>
    IReadOnlyList<string> DepartureRegions);

/// <summary>One option of the /tours destination filter: a place with at least one published tour.</summary>
public sealed record TourDestinationDto(string Id, string Name, int TourCount);

/// <summary>One day of the /tours date filter: how many tours (matching the other filters) leave that day.</summary>
public sealed record TourDayCountDto(DateOnly Date, int TourCount);

/// <summary>One tour in the search box suggestions: enough to recognise it and open its page.</summary>
public sealed record TourSuggestionDto(string Id, string Code, string Title, string Destination, decimal BasePrice);

/// <summary>GET /api/tours/suggest: destinations (open the filtered list) and tours (open the tour page).</summary>
public sealed record TourSuggestionsDto(IReadOnlyList<TourDestinationDto> Destinations,
    IReadOnlyList<TourSuggestionDto> Tours)
{
    public static readonly TourSuggestionsDto Empty = new([], []);
}

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

/// <summary>
/// One bookable departure leaving soon (home "Sắp khởi hành"). Seats and price are this departure's own values
/// at request time; <see cref="DaysUntilDeparture"/> counts from today in Vietnam, so the client clock never matters.
/// </summary>
public sealed record UpcomingDepartureDto(
    string DepartureId,
    string TourId,
    string TourCode,
    string TourTitle,
    string Destination,
    string DepartureFrom,
    DateOnly DepartureDate,
    int DurationDays,
    int DurationNights,
    int AvailableSeats,
    decimal AdultPrice,
    int DaysUntilDeparture);

/// <summary>Raw row behind <see cref="UpcomingDepartureDto"/>; the service derives seats and day count.</summary>
public sealed record UpcomingDepartureRow(
    string DepartureId,
    string TourId,
    string TourCode,
    string TourTitle,
    string Destination,
    string DepartureFrom,
    DateOnly DepartureDate,
    int DurationDays,
    int DurationNights,
    int Capacity,
    int ReservedSeats,
    decimal AdultPrice);

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
