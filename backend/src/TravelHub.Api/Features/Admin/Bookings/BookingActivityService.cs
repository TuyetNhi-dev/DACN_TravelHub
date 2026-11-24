using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin.Bookings;

/// <summary>
/// The order's payments, status history and internal notes. Same visibility as the order itself: an order outside
/// the operator's scope answers 404, as on GET /api/admin/bookings/{id}.
/// </summary>
public sealed class BookingActivityService(AdminAccessService accessService, BookingActivityRepository repository)
{
    private const string NotFound = "Không tìm thấy đơn đặt chỗ.";

    public async Task<BookingActivityDto> GetAsync(Account account, string rawId, CancellationToken ct)
    {
        var (_, owner, id) = await VisibleAsync(account, rawId, ct);
        return await repository.ReadAsync(owner, id, ct);
    }

    public async Task<BookingActivityDto> AddNoteAsync(Account account, string rawId, BookingNoteRequest request,
        CancellationToken ct)
    {
        // Role first (403), then the text (400), then whether the order is visible (404).
        await accessService.RequireAsync(account, ct);
        var text = BookingNoteRules.Validate(request);
        var (access, owner, id) = await VisibleAsync(account, rawId, ct);
        var audit = await accessService.AuditAsync(access, AuditActions.BookingNote, AuditEntities.Booking,
            ResourceId.Format(id), owner.SellingBranchId, $"Thêm ghi chú nội bộ cho đơn {owner.Code}", null, ct);
        await repository.AddNoteAsync(id, access.UserId, text, audit, ct);
        return await repository.ReadAsync(owner, id, ct);
    }

    private async Task<(AdminAccess Access, BookingOwnerRow Owner, ulong Id)> VisibleAsync(Account account,
        string rawId, CancellationToken ct)
    {
        var access = await accessService.RequireAsync(account, ct);
        var id = ResourceId.Parse(rawId, "id");
        var owner = await repository.FindAsync(id, ct);
        if (owner is null || !access.View.Covers(owner.SellingBranchId)) throw ApiException.NotFound(NotFound);
        return (access, owner, id);
    }
}
