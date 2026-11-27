using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Admin.Departures;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Tickets;

namespace TravelHub.Api.Features.Admin.CheckIn;

/// <summary>
/// Group check-in of a departure. Every operator whose view scope covers the running branch may check in (STAFF
/// included); only BRANCH_MANAGER and ADMIN of that branch may undo. A departure outside the scope answers 404.
/// </summary>
public sealed class CheckInService(AdminAccessService accessService, AdminDepartureRepository departures,
    CheckInRepository repository, VietnamClock clock, IOptions<TicketOptions> ticketOptions)
{
    private const string NotFound = "Không tìm thấy lịch khởi hành.";

    public async Task<CheckInBoardDto> GetBoardAsync(Account account, string rawId, CancellationToken ct)
    {
        var (access, row) = await VisibleAsync(account, rawId, ct);
        return await BoardAsync(access, row, ct);
    }

    /// <summary>Verifies a scanned QR and returns its order. Read only: the operator then picks who boards.</summary>
    public async Task<CheckInBookingDto> ScanAsync(Account account, string rawId, ScanTicketRequest request,
        CancellationToken ct)
    {
        var (_, row) = await VisibleAsync(account, rawId, ct);
        CheckInRules.EnsureOpen(clock.Today, row.Departure);
        var key = TicketService.RequireSigningKey(ticketOptions.Value);
        var claim = TicketToken.Verify(request.Payload, key)
            ?? throw ApiException.BadRequest("Mã QR không hợp lệ hoặc không phải vé SàiHành.", "invalid_ticket");
        var ticket = await repository.FindTicketAsync(claim.Code, ct)
            ?? throw ApiException.NotFound("Không tìm thấy vé.");
        var departureId = ResourceId.Parse(row.Departure.Id, "id");
        if (CheckInRules.TicketProblem(ticket, claim.Version, departureId) is { } problem)
            throw ApiException.Conflict(problem);
        var bookings = await repository.ListBoardAsync(departureId, ct);
        return bookings.FirstOrDefault(b => b.BookingId == ticket.BookingId)
            ?? throw ApiException.Conflict("Đơn của vé này chưa có tên hành khách.");
    }

    public async Task<CheckInBoardDto> CheckInAsync(Account account, string rawId, CheckInRequest request,
        CancellationToken ct)
    {
        // Role first (403), then the body (400), then whether the departure is visible (404).
        await accessService.RequireAsync(account, ct);
        var passengerIds = CheckInRules.PassengerIds(request);
        var (access, row) = await VisibleAsync(account, rawId, ct);
        CheckInRules.EnsureOpen(clock.Today, row.Departure);
        var audit = await AuditTemplateAsync(access, row, AuditActions.BookingCheckIn, ct);
        await repository.CheckInAsync(ResourceId.Parse(row.Departure.Id, "id"), passengerIds, access.UserId,
            (target, count) => Audit(audit, target, count, "Check-in", row.Departure), ct);
        return await BoardAsync(access, row, ct);
    }

    public async Task<CheckInBoardDto> UndoAsync(Account account, string rawId, string rawPassengerId,
        CancellationToken ct)
    {
        // STAFF is refused (403) before anything is read; a manager of another branch gets 404 or 403 below.
        await accessService.RequireManagerAsync(account, ct);
        var passengerId = ResourceId.Parse(rawPassengerId, "passengerId");
        var (access, row) = await VisibleAsync(account, rawId, ct);
        AdminAccessService.EnsureCanManage(access, row.BranchId, NotFound);
        CheckInRules.EnsureOpen(clock.Today, row.Departure);
        var audit = await AuditTemplateAsync(access, row, AuditActions.BookingCheckInUndo, ct);
        await repository.UndoAsync(ResourceId.Parse(row.Departure.Id, "id"), passengerId,
            (target, count) => Audit(audit, target, count, "Hoàn tác check-in", row.Departure), ct);
        return await BoardAsync(access, row, ct);
    }

    private async Task<CheckInBoardDto> BoardAsync(AdminAccess access, AdminDepartureRow row, CancellationToken ct)
    {
        var bookings = await repository.ListBoardAsync(ResourceId.Parse(row.Departure.Id, "id"), ct);
        var passengers = bookings.SelectMany(b => b.Passengers).ToList();
        var canManage = access.Manage.Covers(row.BranchId);
        return new CheckInBoardDto(row.Departure with { CanEdit = canManage },
            CheckInRules.ClosedReason(clock.Today, row.Departure), canManage, ticketOptions.Value.IsConfigured,
            passengers.Count, passengers.Count(p => p.CheckedInAt is not null), bookings);
    }

    private async Task<(AdminAccess Access, AdminDepartureRow Row)> VisibleAsync(Account account, string rawId,
        CancellationToken ct)
    {
        var access = await accessService.RequireAsync(account, ct);
        var row = await departures.FindAsync(ResourceId.Parse(rawId, "id"), ct);
        if (row is null || !access.View.Covers(row.BranchId)) throw ApiException.NotFound(NotFound);
        return (access, row);
    }

    /// <summary>Branch and region are the departure's, so the row shows up in that branch's audit log.</summary>
    private Task<AuditEntry> AuditTemplateAsync(AdminAccess access, AdminDepartureRow row, string action,
        CancellationToken ct) =>
        accessService.AuditAsync(access, action, AuditEntities.Booking, "", row.BranchId, "", null, ct);

    // Names and ticket codes stay out of the log: the order code and a head count are enough to trace it.
    private static AuditEntry Audit(AuditEntry template, CheckInTargetRow target, int count, string verb,
        AdminDepartureDto departure) => template with
    {
        EntityId = target.BookingId,
        Summary = CheckInRules.Summary(verb, count, target.BookingCode, departure),
    };
}
