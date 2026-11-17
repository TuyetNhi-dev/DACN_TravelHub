using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Admin;

public sealed record ConfirmBookingRequest(string? SupplierConfirmationCode);

/// <summary>Operator back-office: process orders inside the operator's branch/region scope.</summary>
public sealed class AdminBookingService(BookingRepository repository, VietnamClock clock,
    ILogger<AdminBookingService> logger)
{
    public Task<IReadOnlyList<BookingSummaryDto>> ListAsync(Account operatorAccount, string? itemStatus,
        string? serviceType, CancellationToken ct)
    {
        var scope = RequireScope(operatorAccount);
        var errors = new ValidationErrors();
        errors.AddIf(itemStatus is not null && !BookingItemStatus.All.Contains(itemStatus), "status",
            "Trạng thái lọc không hợp lệ.");
        errors.AddIf(serviceType is not null && !ServiceType.All.Contains(serviceType), "serviceType",
            "Loại dịch vụ không hợp lệ.");
        errors.ThrowIfAny();
        return repository.ListForStaffAsync(scope, new StaffBookingFilter(itemStatus, serviceType), ct);
    }

    public async Task<BookingDetailDto> GetAsync(Account operatorAccount, string rawId, CancellationToken ct)
    {
        var scope = RequireScope(operatorAccount);
        var row = await repository.FindDetailAsync(ResourceId.Parse(rawId, "id"), ct);
        if (row is null || !scope.Covers(row.SellingBranchId, row.BranchRegionId)) throw NotFound();
        return BookingMapper.ToDetail(row, canCancel: false, includeCustomer: true);
    }

    public Task<BookingDetailDto> ConfirmAsync(Account operatorAccount, string rawId,
        ConfirmBookingRequest request, CancellationToken ct) =>
        ChangeAsync(operatorAccount, rawId, "confirmed", async (session, item) =>
        {
            if (item.Status != BookingLifecycle.ConfirmableStatus(item.ServiceType))
                throw ApiException.Conflict("Đơn không ở trạng thái chờ xác nhận.");
            var code = ValidConfirmationCode(request.SupplierConfirmationCode, item.ServiceType);
            await BookingLifecycle.TransitionAsync(session, item, BookingItemStatus.Confirmed, code, ct);
        }, ct);

    public Task<BookingDetailDto> RejectAsync(Account operatorAccount, string rawId, CancellationToken ct) =>
        ChangeAsync(operatorAccount, rawId, "rejected", async (session, item) =>
        {
            if (item.Status != BookingLifecycle.ConfirmableStatus(item.ServiceType))
                throw ApiException.Conflict("Chỉ từ chối được đơn đang chờ xác nhận.");
            await BookingLifecycle.CloseAsync(session, item, BookingLifecycle.RejectedStatus(item.ServiceType), ct);
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
        var scope = RequireScope(operatorAccount);
        var bookingId = ResourceId.Parse(rawId, "id");
        var current = await repository.FindDetailAsync(bookingId, ct);
        if (current is null || !scope.Covers(current.SellingBranchId, current.BranchRegionId)) throw NotFound();
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

    /// <summary>Partner quotes must carry the partner's reference; tours are confirmed in-house.</summary>
    private static string? ValidConfirmationCode(string? raw, string serviceType)
    {
        var code = string.IsNullOrWhiteSpace(raw) ? null : raw.Trim();
        var errors = new ValidationErrors();
        errors.AddIf(code is null && serviceType != ServiceType.Tour, "supplierConfirmationCode",
            "Vui lòng nhập mã xác nhận của đối tác.");
        errors.AddIf(code?.Length > BookingLimits.MaxConfirmationCodeLength, "supplierConfirmationCode",
            "Mã xác nhận tối đa 120 ký tự.");
        errors.ThrowIfAny();
        return code;
    }

    private static StaffScope RequireScope(Account account) => StaffScope.From(account.User)
        ?? throw ApiException.Forbidden("Bạn không có quyền truy cập trang quản trị.");

    private static ApiException NotFound() => ApiException.NotFound("Không tìm thấy đơn đặt chỗ.");
}
