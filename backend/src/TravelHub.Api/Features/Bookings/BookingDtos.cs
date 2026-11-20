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
    DateTime? HoldExpiresAt,
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
    DateTime? HoldExpiresAt,
    DateTime? PaidAt,
    IReadOnlyList<PriceLineDto> PriceLines,
    IReadOnlyList<PassengerDto> Passengers,
    BookingCustomerDto? Customer,
    bool CanCancel,
    bool CanPay);

/// <summary>
/// IdempotencyKey lets a retried simulated-pay request return the same result instead of paying twice.
/// Gateway selects the payment method: "vnpay" redirects to VNPAY; anything else uses the simulated flow.
/// </summary>
public sealed record PayBookingRequest(string? IdempotencyKey, string? Gateway);

/// <summary>
/// Discriminated response from POST /api/bookings/{id}/pay.
/// Type "confirmed": simulated payment succeeded inline; Booking is non-null.
/// Type "redirect": VNPAY gateway requires a browser redirect; RedirectUrl is non-null.
/// </summary>
public sealed record PayBookingResponse(string Type, BookingDetailDto? Booking, string? RedirectUrl)
{
    public static PayBookingResponse Confirmed(BookingDetailDto booking) =>
        new("confirmed", booking, null);
    public static PayBookingResponse Redirect(string url) =>
        new("redirect", null, url);
}

/// <summary>
/// Frozen at order time in booking_items.price_snapshot so later catalogue edits never change an order.
/// </summary>
public sealed record BookingSnapshot(string Title, string? Subtitle, DateOnly? StartDate, DateOnly? EndDate,
    IReadOnlyList<PriceLineDto> PriceLines, string? Terms);
