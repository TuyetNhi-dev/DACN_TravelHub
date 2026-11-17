using TravelHub.Api.Common.Errors;

namespace TravelHub.Api.Features.Bookings;

/// <summary>Allowed status transitions, shared by customer and operator actions.</summary>
public static class BookingLifecycle
{
    /// <summary>Customers may withdraw only before SàiHành or the partner has confirmed, and before the trip.</summary>
    public static bool CustomerCanCancel(string itemStatus, DateOnly? startDate, DateOnly today) =>
        BookingItemStatus.Open.Contains(itemStatus) && (startDate is null || startDate > today);

    /// <summary>The status an item must be in before an operator may confirm it.</summary>
    public static string ConfirmableStatus(string serviceType) => BookingItemStatus.InitialFor(serviceType);

    /// <summary>A tour seat hold is cancelled; a partner refusal on a quote is recorded as failed.</summary>
    public static string RejectedStatus(string serviceType) =>
        serviceType == ServiceType.Tour ? BookingItemStatus.Cancelled : BookingItemStatus.Failed;

    public static bool CanComplete(LockedItem item, DateOnly today) =>
        item.Status == BookingItemStatus.Confirmed && (item.EndDate ?? item.StartDate) is { } last && last < today;

    /// <summary>Moves the item to a closed status and gives tour seats back to the departure.</summary>
    public static async Task CloseAsync(BookingWriteSession session, LockedItem item, string closedStatus,
        CancellationToken ct)
    {
        await TransitionAsync(session, item, closedStatus, null, ct);
        if (item is { ServiceType: ServiceType.Tour, DepartureId: { } departureId } && HoldsSeats(item.Status))
            await session.ReleaseSeatsAsync(departureId, item.Seats, ct);
    }

    public static async Task TransitionAsync(BookingWriteSession session, LockedItem item, string toStatus,
        string? confirmationCode, CancellationToken ct)
    {
        if (!await session.TransitionItemAsync(item, toStatus, confirmationCode, ct))
            throw ApiException.Conflict("Đơn vừa được cập nhật. Vui lòng tải lại để xem trạng thái mới nhất.");
    }

    private static bool HoldsSeats(string status) =>
        status is BookingItemStatus.Pending or BookingItemStatus.Confirmed;
}
