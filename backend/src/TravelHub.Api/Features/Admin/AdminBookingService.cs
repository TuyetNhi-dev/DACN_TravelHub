using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Admin;

public sealed record ConfirmBookingRequest(string? SupplierConfirmationCode);

/// <summary>Operator back-office. STAFF and ADMIN have global scope and see every order.</summary>
public sealed class AdminBookingService(BookingRepository repository, VietnamClock clock,
    ILogger<AdminBookingService> logger)
{
    public Task<IReadOnlyList<BookingSummaryDto>> ListAsync(Account operatorAccount, string? itemStatus,
        string? serviceType, CancellationToken ct)
    {
        RequireScope(operatorAccount);
        var errors = new ValidationErrors();
        errors.AddIf(itemStatus is not null && !BookingItemStatus.All.Contains(itemStatus), "status",
            "Trạng thái lọc không hợp lệ.");
        errors.AddIf(serviceType is not null && !ServiceType.All.Contains(serviceType), "serviceType",
            "Loại dịch vụ không hợp lệ.");
        errors.ThrowIfAny();
        return repository.ListForStaffAsync(new StaffBookingFilter(itemStatus, serviceType), ct);
    }

    public async Task<BookingDetailDto> GetAsync(Account operatorAccount, string rawId, CancellationToken ct)
    {
        RequireScope(operatorAccount);
        var row = await repository.FindDetailAsync(ResourceId.Parse(rawId, "id"), ct) ?? throw NotFound();
        return BookingMapper.ToDetail(row, canCancel: false, canPay: false, includeCustomer: true);
    }

    public Task<BookingDetailDto> ConfirmAsync(Account operatorAccount, string rawId,
        ConfirmBookingRequest request, CancellationToken ct) =>
        ChangeAsync(operatorAccount, rawId, "confirmed", async (session, item) =>
        {
            if (item.HoldsSeats)
                throw ApiException.Conflict("Đơn giữ chỗ được xác nhận tự động khi khách thanh toán trong hạn.");
            if (!BookingLifecycle.StaffCanConfirm(item.HoldsSeats, item.Status))
                throw ApiException.Conflict("Đơn không ở trạng thái chờ đối tác xác nhận.");
            var code = ValidConfirmationCode(request.SupplierConfirmationCode);
            // The partner has confirmed; the customer pays next (simulated), which confirms the order.
            await BookingLifecycle.TransitionAsync(session, item, BookingItemStatus.AwaitingPayment, code, ct);
        }, ct);

    public Task<BookingDetailDto> RejectAsync(Account operatorAccount, string rawId, CancellationToken ct) =>
        ChangeAsync(operatorAccount, rawId, "rejected", async (session, item) =>
        {
            if (item.Status != BookingLifecycle.RejectableStatus(item.HoldsSeats))
                throw ApiException.Conflict("Chỉ từ chối được đơn đang chờ xác nhận.");
            await BookingLifecycle.CloseAsync(session, item, BookingLifecycle.RejectedStatus(item.HoldsSeats), ct);
        }, ct);

    public Task<BookingDetailDto> CompleteAsync(Account operatorAccount, string rawId, CancellationToken ct) =>
        ChangeAsync(operatorAccount, rawId, "completed", async (session, item) =>
        {
            if (!BookingLifecycle.CanComplete(item, clock.Today))
                throw ApiException.Conflict("Chỉ hoàn tất được đơn đã xác nhận và đã qua ngày sử dụng dịch vụ.");
            await BookingLifecycle.TransitionAsync(session, item, BookingItemStatus.Completed, null, ct);
        }, ct);

    private async Task<BookingDetailDto> ChangeAsync(Account operatorAccount, string rawId, string action,
        Func<BookingWriteSession, LockedItem, Task> change, CancellationToken ct)
    {
        RequireScope(operatorAccount);
        var bookingId = ResourceId.Parse(rawId, "id");
        await using (var session = await repository.BeginWriteAsync(ct))
        {
            var item = await session.LockItemAsync(bookingId, ct) ?? throw NotFound();
            await change(session, item);
            await session.CommitAsync(ct);
        }
        logger.LogInformation("Booking {BookingId} {Action} by operator {OperatorId}",
            bookingId, action, operatorAccount.User.Id);
        return await GetAsync(operatorAccount, rawId, ct);
    }

    /// <summary>Only partner services are confirmed by staff, and they must carry the partner's reference.</summary>
    private static string ValidConfirmationCode(string? raw)
    {
        var code = string.IsNullOrWhiteSpace(raw) ? null : raw.Trim();
        var errors = new ValidationErrors();
        errors.AddIf(code is null, "supplierConfirmationCode",
            "Vui lòng nhập mã xác nhận của đối tác.");
        errors.AddIf(code?.Length > BookingLimits.MaxConfirmationCodeLength, "supplierConfirmationCode",
            "Mã xác nhận tối đa 120 ký tự.");
        errors.ThrowIfAny();
        return code!;
    }

    private static StaffScope RequireScope(Account account) => StaffScope.From(account.User)
        ?? throw ApiException.Forbidden("Bạn không có quyền truy cập trang quản trị.");

    private static ApiException NotFound() => ApiException.NotFound("Không tìm thấy đơn đặt chỗ.");
}
