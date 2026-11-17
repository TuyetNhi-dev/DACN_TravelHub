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

public sealed record TourDetailDto(
    TourSummaryDto Tour,
    IReadOnlyList<ItineraryDayDto> Itinerary,
    IReadOnlyList<TourDepartureDto> Departures);

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
