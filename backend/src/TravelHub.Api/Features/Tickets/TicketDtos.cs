namespace TravelHub.Api.Features.Tickets;

public sealed record TicketPassengerDto(string FullName, string Type, bool CheckedIn);

/// <summary>
/// GET /api/bookings/{id}/ticket: the customer's own tour e-ticket. QrPayload is what the QR encodes; it holds no
/// personal data, so the names below are only on the screen and the printout, never in the code itself.
/// </summary>
public sealed record TourTicketDto(string BookingId, string BookingCode, string ItemStatus, string TicketCode,
    string QrPayload, string TourCode, string TourTitle, string DepartureFrom, DateOnly DepartureDate,
    DateOnly ReturnDate, IReadOnlyList<TicketPassengerDto> Passengers);

/// <summary>The tour item of a customer's order, before a ticket is attached.</summary>
public sealed record CustomerTourItemRow(ulong ItemId, string BookingId, string BookingCode, string ItemStatus,
    string TourCode, string TourTitle, string DepartureFrom, DateOnly DepartureDate, DateOnly ReturnDate);

public sealed record TicketKey(string Code, int Version);
