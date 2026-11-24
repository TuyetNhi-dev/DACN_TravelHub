using TravelHub.Api.Features.Admin.Departures;

namespace TravelHub.Api.Features.Admin.CheckIn;

public sealed record CheckInPassengerDto(string Id, string FullName, string Type, DateTime? CheckedInAt,
    string? CheckedInBy);

/// <summary>A paid order of the departure; only these passengers can board.</summary>
public sealed record CheckInBookingDto(string BookingId, string Code, string ContactName, string? ContactPhone,
    IReadOnlyList<CheckInPassengerDto> Passengers);

/// <summary>
/// GET /api/admin/departures/{id}/check-in. ClosedReason is null while check-in is open. CanUndo: the operator may
/// take back a check-in (BRANCH_MANAGER or ADMIN of the running branch).
/// </summary>
public sealed record CheckInBoardDto(AdminDepartureDto Departure, string? ClosedReason, bool CanUndo,
    bool CanScan, int PassengerCount, int CheckedInCount, IReadOnlyList<CheckInBookingDto> Bookings);

/// <summary>The text read from a QR code (or typed from the ticket).</summary>
public sealed record ScanTicketRequest(string? Payload);

public sealed record CheckInRequest(IReadOnlyList<string>? PassengerIds);

/// <summary>A paid-or-not tour item found by its ticket code.</summary>
public sealed record TicketLookupRow(string BookingId, int Version, string ItemStatus, ulong DepartureId);

/// <summary>A passenger about to be checked in, with the order it belongs to (for the audit row).</summary>
public sealed record CheckInTargetRow(ulong PassengerId, ulong ItemId, string BookingId, string BookingCode);
