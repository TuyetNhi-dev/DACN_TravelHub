namespace TravelHub.Api.Features.Bookings;

public sealed record PassengerInput(string? FullName, string? PassengerType, DateOnly? BirthDate);

public sealed record CreateTourBookingRequest(string? DepartureId, int AdultCount, int ChildCount,
    IReadOnlyList<PassengerInput>? Passengers);

public sealed record CreateHotelBookingRequest(string? RoomTypeId, DateOnly? CheckIn, DateOnly? CheckOut,
    int RoomCount, int GuestCount, string? LeadGuestName);

public sealed record CreateFlightBookingRequest(string? OfferId, IReadOnlyList<PassengerInput>? Passengers);

public sealed record PriceLineDto(string Label, int Quantity, decimal UnitPrice, decimal Amount);

public sealed record PassengerDto(string FullName, string PassengerType, DateOnly? BirthDate);

public sealed record BookingCustomerDto(string Id, string FullName, string Email, string? Phone);

public sealed record BookingSummaryDto(
    string Id,
    string Code,
    string ServiceType,
    string Status,
    string ItemStatus,
    string Title,
    string? Subtitle,
    DateOnly? StartDate,
    decimal Total,
    DateTime CreatedAt,
    BookingCustomerDto? Customer);

public sealed record BookingDetailDto(
    string Id,
    string Code,
    string ServiceType,
    string Status,
    string ItemStatus,
    string Title,
    string? Subtitle,
    DateOnly? StartDate,
    DateOnly? EndDate,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal Total,
    string? SupplierConfirmationCode,
    string? Terms,
    DateTime CreatedAt,
    IReadOnlyList<PriceLineDto> PriceLines,
    IReadOnlyList<PassengerDto> Passengers,
    BookingCustomerDto? Customer,
    bool CanCancel);

/// <summary>
/// Frozen at order time in booking_items.price_snapshot so later catalogue edits never change an order.
/// </summary>
public sealed record BookingSnapshot(string Title, string? Subtitle, DateOnly? StartDate, DateOnly? EndDate,
    IReadOnlyList<PriceLineDto> PriceLines, string? Terms);
