using TravelHub.Api.Features.Bookings;
using TravelHub.Api.Features.Payments;

namespace TravelHub.Api.Tests;

/// <summary>
/// Unit tests for VnPayConfirmDecision.Evaluate — pure business logic, no I/O.
/// Covers idempotency, E1 (hold expired but status still pending), and amount mismatch.
/// </summary>
public sealed class VnPayConfirmDecisionTests
{
    private const decimal BookingTotal = 1_990_000m;

    private static LockedItem MakeItem(string status, DateTime? holdExpires = null) =>
        new(BookingId: 1, ItemId: 1, CustomerId: 42, SellingBranchId: null,
            ServiceType: ServiceType.Tour, Status: status,
            DepartureId: 10, Seats: 2,
            StartDate: new DateOnly(2026, 12, 15), EndDate: new DateOnly(2026, 12, 18),
            HoldExpiresAt: holdExpires, Total: BookingTotal);

    // --- Idempotency ---

    [Fact]
    public void AlreadyProcessed_flag_wins_regardless_of_item_status()
    {
        // Even if status is pending and amount is correct, an existing payment row stops re-processing.
        var outcome = VnPayConfirmDecision.Evaluate(
            MakeItem(BookingItemStatus.Pending), amountVnd: 1_990_000, alreadyProcessed: true);

        Assert.Equal(VnPayConfirmOutcome.AlreadyProcessed, outcome);
    }

    [Fact]
    public void AlreadyProcessed_flag_wins_even_when_amount_would_mismatch()
    {
        var outcome = VnPayConfirmDecision.Evaluate(
            MakeItem(BookingItemStatus.Pending), amountVnd: 1, alreadyProcessed: true);

        Assert.Equal(VnPayConfirmOutcome.AlreadyProcessed, outcome);
    }

    // --- Amount mismatch ---

    [Fact]
    public void Amount_lower_than_total_returns_mismatch()
    {
        var outcome = VnPayConfirmDecision.Evaluate(
            MakeItem(BookingItemStatus.Pending), amountVnd: 999_000, alreadyProcessed: false);

        Assert.Equal(VnPayConfirmOutcome.AmountMismatch, outcome);
    }

    [Fact]
    public void Amount_higher_than_total_returns_mismatch()
    {
        var outcome = VnPayConfirmDecision.Evaluate(
            MakeItem(BookingItemStatus.Pending), amountVnd: 9_990_000, alreadyProcessed: false);

        Assert.Equal(VnPayConfirmOutcome.AmountMismatch, outcome);
    }

    [Fact]
    public void Amount_zero_returns_mismatch()
    {
        var outcome = VnPayConfirmDecision.Evaluate(
            MakeItem(BookingItemStatus.Pending), amountVnd: 0, alreadyProcessed: false);

        Assert.Equal(VnPayConfirmOutcome.AmountMismatch, outcome);
    }

    // --- E1: hold expired scenarios ---

    [Fact]
    public void Pending_within_hold_window_returns_confirm()
    {
        var outcome = VnPayConfirmDecision.Evaluate(
            MakeItem(BookingItemStatus.Pending, holdExpires: DateTime.UtcNow.AddMinutes(5)),
            amountVnd: 1_990_000, alreadyProcessed: false);

        Assert.Equal(VnPayConfirmOutcome.Confirm, outcome);
    }

    [Fact]
    public void Pending_hold_expired_but_job_has_not_run_still_returns_confirm()
    {
        // The hold deadline has passed, but item.Status is still "pending" because the FOR UPDATE
        // lock means the expiry job has not yet acted. Seats are still held — confirm the booking.
        var pastExpiry = DateTime.UtcNow.AddMinutes(-2);

        var outcome = VnPayConfirmDecision.Evaluate(
            MakeItem(BookingItemStatus.Pending, holdExpires: pastExpiry),
            amountVnd: 1_990_000, alreadyProcessed: false);

        Assert.Equal(VnPayConfirmOutcome.Confirm, outcome);
    }

    [Fact]
    public void Cancelled_by_job_before_ipn_returns_refund_needed()
    {
        // The expiry job ran first: status is "cancelled" and seats are already released.
        var outcome = VnPayConfirmDecision.Evaluate(
            MakeItem(BookingItemStatus.Cancelled), amountVnd: 1_990_000, alreadyProcessed: false);

        Assert.Equal(VnPayConfirmOutcome.RefundNeeded, outcome);
    }

    // --- Other statuses ---

    [Fact]
    public void Already_confirmed_returns_booking_not_payable()
    {
        // Booking was confirmed through another path before this IPN; shouldn't happen but
        // must be handled gracefully.
        var outcome = VnPayConfirmDecision.Evaluate(
            MakeItem(BookingItemStatus.Confirmed), amountVnd: 1_990_000, alreadyProcessed: false);

        Assert.Equal(VnPayConfirmOutcome.BookingNotPayable, outcome);
    }

    [Fact]
    public void Awaiting_payment_with_correct_amount_returns_confirm()
    {
        // Hotel/flight that reached awaiting_payment can also be paid through VNPAY.
        var outcome = VnPayConfirmDecision.Evaluate(
            MakeItem(BookingItemStatus.AwaitingPayment), amountVnd: 1_990_000, alreadyProcessed: false);

        Assert.Equal(VnPayConfirmOutcome.Confirm, outcome);
    }
}
