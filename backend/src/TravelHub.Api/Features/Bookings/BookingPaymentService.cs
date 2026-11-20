using System.Text.RegularExpressions;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Payments;

namespace TravelHub.Api.Features.Bookings;

/// <summary>
/// Payment flows (simulated and VNPAY) and tour hold expiry.
/// Every state change runs on the order row locked FOR UPDATE so the expiry job and a payment
/// can never both win, and seats are released exactly once.
/// </summary>
public sealed partial class BookingPaymentService(
    BookingRepository repository,
    BookingService bookings,
    VietnamClock clock,
    ILogger<BookingPaymentService> logger,
    VnPayPaymentGateway vnPayGateway)
{
    public const string HoldExpiredCode = "hold_expired";

    public async Task<BookingDetailDto> PayAsync(ulong customerId, string rawId, PayBookingRequest request,
        CancellationToken ct)
    {
        var bookingId = ResourceId.Parse(rawId, "id");
        var key = IdempotencyKey(request.IdempotencyKey);
        var now = clock.UtcNow;
        await using (var session = await repository.BeginWriteAsync(ct))
        {
            var item = await session.LockItemAsync(bookingId, ct);
            if (item is null || item.CustomerId != customerId)
                throw ApiException.NotFound("Không tìm thấy đơn đặt chỗ.");
            // A retried request with the same key returns the already-paid order instead of paying twice.
            if (await session.HasPaymentAsync(bookingId, key, ct))
                return await bookings.GetForCustomerAsync(customerId, rawId, ct);
            if (BookingLifecycle.IsHoldExpired(item.HoldsSeats, item.Status, item.HoldExpiresAt, now))
            {
                await ReleaseExpiredAsync(session, item, ct);
                throw new ApiException(StatusCodes.Status409Conflict,
                    "Đã hết thời gian giữ chỗ nên đơn đã bị hủy. Vui lòng đặt lại.", HoldExpiredCode);
            }
            if (!BookingLifecycle.CanPay(item.HoldsSeats, item.Status, item.HoldExpiresAt, now))
                throw ApiException.Conflict(item.HoldsSeats
                    ? "Đơn không còn ở trạng thái chờ thanh toán."
                    : "Đơn chưa được đối tác xác nhận hoặc đã được thanh toán.");
            if (!await session.TryInsertPaymentAsync(bookingId, item.Total, key, now, ct))
                throw ApiException.Conflict("Mã thanh toán đã được dùng cho một đơn khác.");
            await BookingLifecycle.TransitionAsync(session, item, BookingItemStatus.Confirmed, null, ct);
            await session.CommitAsync(ct);
        }
        logger.LogInformation("Booking {BookingId} paid (simulated)", bookingId);
        return await bookings.GetForCustomerAsync(customerId, rawId, ct);
    }

    /// <summary>Cancels every seat hold (tour or flight deal) that expired unpaid; returns how many.</summary>
    public async Task<int> ExpireHoldsAsync(CancellationToken ct)
    {
        var cancelled = 0;
        foreach (var bookingId in await repository.ListExpiredHoldsAsync(clock.UtcNow, ct))
        {
            await using var session = await repository.BeginWriteAsync(ct);
            var item = await session.LockItemAsync(bookingId, ct);
            // Re-checked under the lock: the customer may have paid since the list was read.
            if (item is null || !BookingLifecycle.IsHoldExpired(item.HoldsSeats, item.Status, item.HoldExpiresAt,
                    clock.UtcNow)) continue;
            await ReleaseExpiredAsync(session, item, ct);
            cancelled++;
        }
        return cancelled;
    }

    // -------------------------------------------------------------------------
    // VNPAY flows
    // -------------------------------------------------------------------------

    /// <summary>
    /// Phase 1 — generates a VNPAY payment URL and returns a redirect response.
    /// No state is changed; the booking transitions to confirmed only after the IPN or verify-return.
    /// </summary>
    public async Task<PayBookingResponse> InitiateVnPayAsync(ulong customerId, string rawId,
        string clientIpAddress, CancellationToken ct)
    {
        var now = clock.UtcNow;
        var detail = await bookings.GetForCustomerAsync(customerId, rawId, ct);
        if (!detail.CanPay)
            throw ApiException.Conflict(detail.HoldExpiresAt <= now
                ? "Đã hết thời gian giữ chỗ. Vui lòng đặt lại."
                : "Đơn không ở trạng thái chờ thanh toán.");

        var bookingId = ResourceId.Parse(rawId, "id");
        var attempt = await repository.CountPaymentAttemptsAsync(bookingId, ct) + 1;
        var orderInfo = $"Thanh toan tour {detail.Code}";
        var urlRequest = new CreatePaymentUrlRequest(
            detail.Code, attempt, (long)detail.Total, orderInfo,
            now, detail.HoldExpiresAt!.Value, clientIpAddress);

        var result = vnPayGateway.CreatePaymentUrl(urlRequest);
        logger.LogInformation("VNPAY payment URL created for booking {BookingId}, attempt {Attempt}",
            bookingId, attempt);
        return PayBookingResponse.Redirect(result.RedirectUrl!);
    }

    /// <summary>
    /// Phase 2 — called from the IPN handler or verify-return endpoint after VNPAY confirms payment.
    /// Idempotent: calling twice with the same TxnRef returns the same outcome.
    /// </summary>
    public async Task<VnPayConfirmResult> ConfirmVnPayAsync(
        string txnRef, string transactionNo, long amountVnd,
        string responseCode, IDictionary<string, string> rawCallback, CancellationToken ct)
    {
        var bookingCode = VnPayPaymentGateway.BookingCodeFromTxnRef(txnRef);
        var bookingId = await repository.FindIdByCodeAsync(bookingCode, ct);
        if (bookingId is null)
        {
            logger.LogWarning("VNPAY IPN for unknown booking code {Code}", bookingCode);
            return new VnPayConfirmResult(VnPayConfirmOutcome.BookingNotPayable, null);
        }

        await using var session = await repository.BeginWriteAsync(ct);
        var item = await session.LockItemAsync(bookingId.Value, ct);
        if (item is null)
            return new VnPayConfirmResult(VnPayConfirmOutcome.BookingNotPayable, null);

        var alreadyProcessed = await session.HasPaymentByKeyAsync(txnRef, ct);
        var outcome = VnPayConfirmDecision.Evaluate(item, amountVnd, alreadyProcessed);

        switch (outcome)
        {
            case VnPayConfirmOutcome.AlreadyProcessed:
                await session.CommitAsync(ct);
                return new VnPayConfirmResult(outcome, await LoadBookingDetailAsync(bookingId.Value, ct));

            case VnPayConfirmOutcome.Confirm:
                await session.TryInsertGatewayPaymentAsync(bookingId.Value, item.Total, txnRef,
                    transactionNo, PaymentStatus.Succeeded, rawCallback, clock.UtcNow, ct);
                await BookingLifecycle.TransitionAsync(session, item, BookingItemStatus.Confirmed, null, ct);
                await session.CommitAsync(ct);
                logger.LogInformation("VNPAY booking {BookingId} confirmed, TxnRef {TxnRef}", bookingId, txnRef);
                return new VnPayConfirmResult(outcome, await LoadBookingDetailAsync(bookingId.Value, ct));

            case VnPayConfirmOutcome.RefundNeeded:
                // Job cancelled the booking; VNPAY still charged the customer. Record for manual refund.
                await session.TryInsertGatewayPaymentAsync(bookingId.Value, item.Total, txnRef,
                    transactionNo, PaymentStatus.RefundNeeded, rawCallback, clock.UtcNow, ct);
                await session.CommitAsync(ct);
                logger.LogWarning(
                    "VNPAY collected money for already-cancelled booking {BookingId}, TxnRef {TxnRef}. Manual refund required.",
                    bookingId, txnRef);
                return new VnPayConfirmResult(outcome, null);

            case VnPayConfirmOutcome.AmountMismatch:
                await session.TryInsertGatewayPaymentAsync(bookingId.Value, amountVnd, txnRef,
                    transactionNo, PaymentStatus.Failed, rawCallback, clock.UtcNow, ct);
                await session.CommitAsync(ct);
                logger.LogError(
                    "VNPAY amount mismatch for booking {BookingId}: expected {Expected} VND, received {Actual} VND, TxnRef {TxnRef}",
                    bookingId, item.Total, amountVnd, txnRef);
                return new VnPayConfirmResult(outcome, null);

            default:
                logger.LogWarning("VNPAY callback for booking {BookingId} in unexpected status {Status}",
                    bookingId, item.Status);
                return new VnPayConfirmResult(outcome, null);
        }
    }

    private async Task<BookingDetailDto?> LoadBookingDetailAsync(ulong bookingId, CancellationToken ct)
    {
        var row = await repository.FindDetailAsync(bookingId, ct);
        if (row is null) return null;
        var summary = row.Summary;
        var holdsSeats = BookingLifecycle.HoldsSeats(summary.ServiceType, summary.HoldExpiresAt);
        var canPay = BookingLifecycle.CanPay(holdsSeats, summary.ItemStatus, summary.HoldExpiresAt, clock.UtcNow);
        return BookingMapper.ToDetail(row, canCancel: false, canPay, includeCustomer: false);
    }

    // -------------------------------------------------------------------------

    private async Task ReleaseExpiredAsync(BookingWriteSession session, LockedItem item, CancellationToken ct)
    {
        await BookingLifecycle.CloseAsync(session, item, BookingItemStatus.Cancelled, ct);
        await session.CommitAsync(ct);
        logger.LogInformation("Tour hold for booking {BookingId} expired; {Seats} seats released",
            item.BookingId, item.Seats);
    }

    /// <summary>Client-supplied key (letters, digits, dash) or a fresh one when the client sends none.</summary>
    private static string IdempotencyKey(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return Guid.NewGuid().ToString("N");
        var key = raw.Trim();
        if (key.Length > BookingLimits.MaxIdempotencyKeyLength || !KeyPattern().IsMatch(key))
            throw new ApiValidationException(new Dictionary<string, string[]>
            {
                ["idempotencyKey"] = ["Mã thanh toán không hợp lệ."],
            });
        return key;
    }

    [GeneratedRegex("^[A-Za-z0-9-]+$")]
    private static partial Regex KeyPattern();
}
