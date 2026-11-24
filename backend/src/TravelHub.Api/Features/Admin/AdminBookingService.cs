using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Admin;

public sealed record ConfirmBookingRequest(string? SupplierConfirmationCode);

/// <param name="From">First Vietnamese day the order was placed on (inclusive).</param>
/// <param name="To">Last Vietnamese day the order was placed on (inclusive).</param>
/// <param name="Q">Exact booking code, or part of the customer's name, email or phone.</param>
public sealed record AdminBookingQuery(string? Status, string? ServiceType, string? Scope, DateOnly? From = null,
    DateOnly? To = null, string? BranchId = null, string? Q = null);

/// <summary>
/// Operator back-office for orders. Every operator handles the orders sold by a branch of their scope; orders
/// without a branch (online hotels and flights) belong to the global scope only. Out-of-scope orders answer 404.
/// </summary>
public sealed class AdminBookingService(BookingRepository repository, AdminAccessService accessService,
    VietnamClock clock, ILogger<AdminBookingService> logger)
{
    public const int MaxSearchLength = 100;

    public async Task<IReadOnlyList<BookingSummaryDto>> ListAsync(Account operatorAccount, AdminBookingQuery query,
        CancellationToken ct)
    {
        var (_, selected) = await accessService.SelectAsync(operatorAccount, query.Scope, ct);
        var errors = new ValidationErrors();
        errors.AddIf(query.Status is not null && !BookingItemStatus.All.Contains(query.Status), "status",
            "Trạng thái lọc không hợp lệ.");
        errors.AddIf(query.ServiceType is not null && !ServiceType.All.Contains(query.ServiceType), "serviceType",
            "Loại dịch vụ không hợp lệ.");
        errors.AddIf(query.From > query.To, "to", "Ngày kết thúc phải từ ngày bắt đầu trở đi.");
        errors.AddIf(query.BranchId is not null && !ResourceId.TryParse(query.BranchId, out _), "branchId",
            "Mã chi nhánh sai.");
        errors.AddIf(query.Q?.Length > MaxSearchLength, "q", $"Từ khóa tối đa {MaxSearchLength} ký tự.");
        errors.ThrowIfAny();
        var text = string.IsNullOrWhiteSpace(query.Q) ? null : query.Q.Trim();
        return await repository.ListForStaffAsync(new StaffBookingFilter(query.Status, query.ServiceType, selected,
            query.From is { } from ? VietnamClock.StartOfDayUtc(from) : null,
            query.To is { } to ? VietnamClock.StartOfDayUtc(to.AddDays(1)) : null,
            query.BranchId is null ? null : ResourceId.Parse(query.BranchId, "branchId"), text), ct);
    }

    /// <summary>
    /// Staff withdraw an order that is not paid yet (held seats go back exactly once). Paid orders need the refund
    /// process, which this version does not run, so they are refused here.
    /// </summary>
    public Task<BookingDetailDto> CancelAsync(Account operatorAccount, string rawId, CancellationToken ct) =>
        ChangeAsync(operatorAccount, rawId, AuditActions.BookingCancel, "Hủy đơn", async (session, item) =>
        {
            if (!BookingItemStatus.Open.Contains(item.Status))
                throw ApiException.Conflict("Chỉ hủy được đơn chưa thanh toán. Đơn đã thanh toán cần xử lý hoàn tiền.");
            await BookingLifecycle.CloseAsync(session, item, BookingItemStatus.Cancelled, ct);
            return BookingItemStatus.Cancelled;
        }, ct);

    public async Task<BookingDetailDto> GetAsync(Account operatorAccount, string rawId, CancellationToken ct)
    {
        var access = await accessService.RequireAsync(operatorAccount, ct);
        var row = await repository.FindDetailAsync(ResourceId.Parse(rawId, "id"), ct);
        if (row is null || !access.View.Covers(row.SellingBranchId)) throw NotFound();
        return BookingMapper.ToDetail(row, canCancel: false, canPay: false, includeCustomer: true);
    }

    public Task<BookingDetailDto> ConfirmAsync(Account operatorAccount, string rawId,
        ConfirmBookingRequest request, CancellationToken ct) =>
        ChangeAsync(operatorAccount, rawId, AuditActions.BookingConfirm, "Xác nhận đối tác cho đơn",
            async (session, item) =>
        {
            if (item.HoldsSeats)
                throw ApiException.Conflict("Đơn giữ chỗ được xác nhận tự động khi khách thanh toán trong hạn.");
            if (!BookingLifecycle.StaffCanConfirm(item.HoldsSeats, item.Status))
                throw ApiException.Conflict("Đơn không ở trạng thái chờ đối tác xác nhận.");
            var code = ValidConfirmationCode(request.SupplierConfirmationCode);
            // The partner has confirmed; the customer pays next (simulated), which confirms the order.
            await BookingLifecycle.TransitionAsync(session, item, BookingItemStatus.AwaitingPayment, code, ct);
            return BookingItemStatus.AwaitingPayment;
        }, ct);

    public Task<BookingDetailDto> RejectAsync(Account operatorAccount, string rawId, CancellationToken ct) =>
        ChangeAsync(operatorAccount, rawId, AuditActions.BookingReject, "Từ chối đơn", async (session, item) =>
        {
            if (item.Status != BookingLifecycle.RejectableStatus(item.HoldsSeats))
                throw ApiException.Conflict("Chỉ từ chối được đơn đang chờ xác nhận.");
            var status = BookingLifecycle.RejectedStatus(item.HoldsSeats);
            await BookingLifecycle.CloseAsync(session, item, status, ct);
            return status;
        }, ct);

    public Task<BookingDetailDto> CompleteAsync(Account operatorAccount, string rawId, CancellationToken ct) =>
        ChangeAsync(operatorAccount, rawId, AuditActions.BookingComplete, "Hoàn tất đơn", async (session, item) =>
        {
            if (!BookingLifecycle.CanComplete(item, clock.Today))
                throw ApiException.Conflict("Chỉ hoàn tất được đơn đã xác nhận và đã qua ngày sử dụng dịch vụ.");
            await BookingLifecycle.TransitionAsync(session, item, BookingItemStatus.Completed, null, ct);
            return BookingItemStatus.Completed;
        }, ct);

    /// <param name="change">Applies the transition and returns the item's new status.</param>
    private async Task<BookingDetailDto> ChangeAsync(Account operatorAccount, string rawId, string action,
        string verb, Func<BookingWriteSession, LockedItem, Task<string>> change, CancellationToken ct)
    {
        var access = await accessService.RequireAsync(operatorAccount, ct);
        var bookingId = ResourceId.Parse(rawId, "id");
        await using (var session = await repository.BeginWriteAsync(ct))
        {
            var item = await session.LockItemAsync(bookingId, ct);
            if (item is null || !access.View.Covers(item.SellingBranchId)) throw NotFound();
            var status = await change(session, item);
            await session.WriteAuditAsync(await accessService.AuditAsync(access, action, AuditEntities.Booking,
                ResourceId.Format(bookingId), item.SellingBranchId, $"{verb} #{bookingId}",
                [new AuditChange("status", item.Status, status)], ct), ct);
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

    private static ApiException NotFound() => ApiException.NotFound("Không tìm thấy đơn đặt chỗ.");
}
