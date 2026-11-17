using TravelHub.Api.Common.Errors;

namespace TravelHub.Api.Features.Bookings;

/// <summary>
/// Allowed status transitions, shared by customer, operator and background actions.
/// Seat-held items (tours, and flight deals from SàiHành's allotment): pending with seats held until the deadline
/// -> paid -> confirmed; unpaid at the deadline -> cancelled and the seats go back exactly once.
/// Partner quotes (hotels, flights without allotment): awaiting_supplier -> staff confirm with the partner
/// -> awaiting_payment -> paid -> confirmed.
/// </summary>
public static class BookingLifecycle
{
    /// <summary>
    /// Tours always hold seats. A flight holds allotment seats exactly when its order got a hold deadline, which
    /// is set only for deals; hotels and ordinary flight quotes never have one.
    /// </summary>
    public static bool HoldsSeats(string serviceType, DateTime? holdExpiresAt) =>
        serviceType == ServiceType.Tour || holdExpiresAt is not null;

    /// <summary>Customers may withdraw only before the order is paid/confirmed, and before the trip.</summary>
    public static bool CustomerCanCancel(string itemStatus, DateOnly? startDate, DateOnly today) =>
        BookingItemStatus.Open.Contains(itemStatus) && (startDate is null || startDate > today);

    /// <summary>Seat-held items are confirmed by the customer's payment, so staff confirm partner quotes only.</summary>
    public static bool StaffCanConfirm(bool holdsSeats, string itemStatus) =>
        !holdsSeats && itemStatus == BookingItemStatus.AwaitingSupplier;

    /// <summary>The status an item must be in before an operator may reject it.</summary>
    public static string RejectableStatus(bool holdsSeats) => BookingItemStatus.InitialFor(holdsSeats);

    /// <summary>A seat hold is cancelled; a partner refusal on a quote is recorded as failed.</summary>
    public static string RejectedStatus(bool holdsSeats) =>
        holdsSeats ? BookingItemStatus.Cancelled : BookingItemStatus.Failed;

    /// <summary>The status in which the customer may pay.</summary>
    public static string PayableStatus(bool holdsSeats) =>
        holdsSeats ? BookingItemStatus.Pending : BookingItemStatus.AwaitingPayment;

    /// <summary>A seat hold whose deadline has passed. The deadline is server time, compared in UTC.</summary>
    public static bool IsHoldExpired(bool holdsSeats, string itemStatus, DateTime? holdExpiresAt, DateTime nowUtc) =>
        holdsSeats && itemStatus == BookingItemStatus.Pending && holdExpiresAt is { } deadline && deadline <= nowUtc;

    public static bool CanPay(bool holdsSeats, string itemStatus, DateTime? holdExpiresAt, DateTime nowUtc) =>
        itemStatus == PayableStatus(holdsSeats) && !IsHoldExpired(holdsSeats, itemStatus, holdExpiresAt, nowUtc);

    public static bool CanComplete(LockedItem item, DateOnly today) =>
        item.Status == BookingItemStatus.Confirmed && (item.EndDate ?? item.StartDate) is { } last && last < today;

    /// <summary>Moves the item to a closed status and gives held seats back to the departure or the allotment.</summary>
    public static async Task CloseAsync(BookingWriteSession session, LockedItem item, string closedStatus,
        CancellationToken ct)
    {
        await TransitionAsync(session, item, closedStatus, null, ct);
        if (!item.HoldsSeats || !HasSeatsOut(item.Status)) return;
        if (item.DepartureId is { } departureId)
            await session.ReleaseSeatsAsync(departureId, item.Seats, ct);
        else if (item.FlightOfferId is { } offerId)
            await session.ReleaseAllotmentSeatsAsync(offerId, item.Seats, ct);
    }

    /// <summary>
    /// Compare-and-set: the transition (and therefore any seat release that follows it) happens at most once,
    /// even when the expiry job and a customer request race on the same order.
    /// </summary>
    public static async Task TransitionAsync(BookingWriteSession session, LockedItem item, string toStatus,
        string? confirmationCode, CancellationToken ct)
    {
        if (!await session.TransitionItemAsync(item, toStatus, confirmationCode, ct))
            throw ApiException.Conflict("Đơn vừa được cập nhật. Vui lòng tải lại để xem trạng thái mới nhất.");
    }

    private static bool HasSeatsOut(string status) =>
        status is BookingItemStatus.Pending or BookingItemStatus.Confirmed;
}
