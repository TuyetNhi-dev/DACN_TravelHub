using System.Text.RegularExpressions;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;

namespace TravelHub.Api.Features.Bookings;

/// <summary>
/// Simulated payment and tour hold expiry. Every check runs on the order row locked FOR UPDATE, so a payment
/// and the expiry job can never both win, and seats are released at most once.
/// </summary>
public sealed partial class BookingPaymentService(BookingRepository repository, BookingService bookings,
    VietnamClock clock, ILogger<BookingPaymentService> logger)
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
