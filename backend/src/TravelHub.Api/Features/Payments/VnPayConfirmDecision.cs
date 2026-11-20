using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Payments;

public enum VnPayConfirmOutcome
{
    /// <summary>Booking is pending (seats held); proceed to confirm.</summary>
    Confirm,
    /// <summary>A payment row already exists for this TxnRef — idempotent, return existing state.</summary>
    AlreadyProcessed,
    /// <summary>VNPAY amount ÷ 100 does not match booking.total — reject and log.</summary>
    AmountMismatch,
    /// <summary>
    /// Booking was cancelled by the expiry job before the IPN arrived. Seats already released.
    /// VNPAY collected money; a manual refund is required.
    /// </summary>
    RefundNeeded,
    /// <summary>Booking is in an unexpected status (confirmed, completed, failed, etc.).</summary>
    BookingNotPayable,
}

public sealed record VnPayConfirmResult(VnPayConfirmOutcome Outcome, BookingDetailDto? Booking);

/// <summary>
/// Pure, side-effect-free decision logic for processing a VNPAY IPN or verify-return callback.
/// All database I/O happens in BookingPaymentService; this class is independently unit-testable.
/// </summary>
public static class VnPayConfirmDecision
{
    /// <param name="item">Booking item locked FOR UPDATE before calling this method.</param>
    /// <param name="amountVnd">vnp_Amount ÷ 100 from the VNPAY callback.</param>
    /// <param name="alreadyProcessed">True when any payment row for this TxnRef already exists.</param>
    public static VnPayConfirmOutcome Evaluate(LockedItem item, long amountVnd, bool alreadyProcessed)
    {
        if (alreadyProcessed) return VnPayConfirmOutcome.AlreadyProcessed;

        // Amount is verified against booking.total (server-authoritative), never the client's value.
        if (amountVnd != (long)item.Total) return VnPayConfirmOutcome.AmountMismatch;

        return item.Status switch
        {
            // E1: status is still "pending" even if hold_expires_at has passed. The FOR UPDATE lock
            // means the expiry job has not yet run — seats are still held. Confirm the booking.
            BookingItemStatus.Pending        => VnPayConfirmOutcome.Confirm,
            BookingItemStatus.AwaitingPayment => VnPayConfirmOutcome.Confirm,

            // Expiry job cancelled the booking and released seats before the IPN arrived.
            BookingItemStatus.Cancelled      => VnPayConfirmOutcome.RefundNeeded,

            // Any other status (confirmed, completed, failed) is unexpected at this point.
            _                                => VnPayConfirmOutcome.BookingNotPayable,
        };
    }
}
