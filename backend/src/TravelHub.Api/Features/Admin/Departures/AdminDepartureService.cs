using System.Globalization;
using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Admin.Tours;
using TravelHub.Api.Features.Auth;
using A = TravelHub.Api.Features.Admin.Audit.AuditActions;

namespace TravelHub.Api.Features.Admin.Departures;

public sealed record AdminDepartureQuery(string? Scope, string? TourId, DateOnly? From, DateOnly? To,
    string? Status, int? Page, int? PageSize, string? BranchId = null);

/// <summary>Departure calendar. Changes need a branch manager or admin of the branch running the departure.</summary>
public sealed class AdminDepartureService(AdminAccessService accessService, AdminDepartureRepository repository,
    VietnamClock clock)
{
    public const int DefaultPageSize = 30;
    private const int MissingReference = 1452;
    private const string NotFound = "Không tìm thấy lịch khởi hành.";

    public async Task<(IReadOnlyList<AdminDepartureDto> Rows, int Total)> ListAsync(Account account,
        AdminDepartureQuery query, CancellationToken ct)
    {
        var (access, scope) = await accessService.SelectAsync(account, query.Scope, ct);
        var errors = new ValidationErrors();
        errors.AddIf(query.TourId is not null && !ResourceId.TryParse(query.TourId, out _), "tourId", "Mã tour sai.");
        errors.AddIf(query.BranchId is not null && !ResourceId.TryParse(query.BranchId, out _), "branchId",
            "Mã chi nhánh sai.");
        errors.AddIf(query.Status is not null && !DepartureStatus.All.Contains(query.Status), "status",
            "Trạng thái lọc không hợp lệ.");
        errors.ThrowIfAny();
        ulong? tourId = query.TourId is null ? null : ResourceId.Parse(query.TourId, "tourId");
        var size = Math.Clamp(query.PageSize ?? DefaultPageSize, 1, 100);
        ulong? branchId = query.BranchId is null ? null : ResourceId.Parse(query.BranchId, "branchId");
        var (rows, total) = await repository.ListAsync(new AdminDepartureFilter(tourId, query.From, query.To,
            query.Status, branchId), scope, (Math.Max(1, query.Page ?? 1) - 1) * size, size, ct);
        return (rows.Select(r => r.Departure with { CanEdit = access.Manage.Covers(r.BranchId) }).ToList(), total);
    }

    public async Task<AdminDepartureDto> CreateAsync(Account account, string rawTourId, CreateDepartureRequest request,
        CancellationToken ct)
    {
        var errors = new ValidationErrors();
        DepartureRules.AddFutureDate(request.DepartureDate, clock.Today, "departureDate", errors);
        var result = await InsertAsync(account, rawTourId, request.Terms, errors,
            _ => request.DepartureDate is { } day ? [day] : [], A.DepartureCreate, ct);
        if (result.SkippedDates.Count > 0)
            throw ApiException.Conflict("Tour đã có lịch khởi hành ngày này từ cùng điểm khởi hành.");
        var (rows, _) = await repository.ListAsync(new AdminDepartureFilter(ResourceId.Parse(rawTourId, "tourId"),
            request.DepartureDate, request.DepartureDate, null), ScopeSet.Everything, 0, 20, ct);
        var location = Id(request.DepartureLocationId!);
        return rows.First(r => Id(r.Departure.DepartureLocationId) == location).Departure with { CanEdit = true };
    }

    public Task<BulkDeparturesResultDto> CreateWeeklyAsync(Account account, string rawTourId,
        BulkDeparturesRequest request, CancellationToken ct) =>
        InsertAsync(account, rawTourId, request.Terms, new ValidationErrors(),
            errors => DepartureRules.WeeklyDates(request, clock.Today, errors), A.DepartureBulkCreate, ct);

    public async Task<AdminDepartureDto> UpdateAsync(Account account, string rawId, UpdateDepartureRequest request,
        CancellationToken ct)
    {
        var (access, current) = await ManagedAsync(account, rawId, ct);
        var errors = new ValidationErrors();
        var terms = DepartureRules.Terms(new DepartureTermsInput(current.DepartureLocationId,
            request.OperatingBranchId, request.Capacity, request.MinGuests, request.AdultPrice, request.ChildPrice),
            errors);
        errors.ThrowIfAny();
        DepartureRules.EnsureCapacityCoversReserved(terms.Capacity, current.ReservedSeats);
        if (Id(current.BranchId) != terms.OperatingBranchId)
            await accessService.RequireManagedBranchAsync(access, terms.OperatingBranchId, ct);
        var audit = await accessService.AuditAsync(access, A.DepartureUpdate, AuditEntities.Departure, current.Id,
            terms.OperatingBranchId, $"Sửa lịch {current.TourCode} ngày {Day(current.DepartureDate)}",
            AuditChanges.Diff(Fields(current), Fields(terms)), ct);
        if (!await repository.UpdateAsync(Id(current.Id), terms, audit, ct))
            throw ApiException.Conflict($"Đã có {current.ReservedSeats} chỗ được đặt, số chỗ không thể thấp hơn.");
        return await GetAsync(access, current.Id, ct);
    }

    public async Task<AdminDepartureDto> SetStatusAsync(Account account, string rawId, DepartureStatusRequest request,
        CancellationToken ct)
    {
        var (access, current) = await ManagedAsync(account, rawId, ct);
        var status = request.Status ?? "";
        var reason = DepartureRules.CheckTransition(current.Status, request.Status, current.DepartureDate,
            current.ReturnDate, clock.Today, request.Reason);
        var summary = $"{DepartureRules.Label(status)}: lịch {current.TourCode} ngày {Day(current.DepartureDate)}"
            + (reason is null ? "" : $" ({current.ActiveBookings} đơn bị ảnh hưởng). Lý do: {reason}");
        var audit = await accessService.AuditAsync(access, A.DepartureStatus, AuditEntities.Departure, current.Id,
            Id(current.BranchId), summary, [new AuditChange("status", current.Status, status)], ct);
        // The UPDATE re-checks the old status so two staff acting at once cannot both move the departure.
        if (!await repository.SetStatusAsync(Id(current.Id), current.Status, status, reason, audit, ct))
            throw ApiException.Conflict("Lịch vừa được người khác cập nhật, hãy tải lại.");
        return await GetAsync(access, current.Id, ct);
    }

    private async Task<BulkDeparturesResultDto> InsertAsync(Account account, string rawTourId,
        DepartureTermsInput input, ValidationErrors errors, Func<ValidationErrors, IReadOnlyList<DateOnly>> dates,
        string action, CancellationToken ct)
    {
        var access = await accessService.RequireManagerAsync(account, ct);
        var tourId = ResourceId.Parse(rawTourId, "tourId");
        var tour = await repository.FindTourAsync(tourId, ct) ?? throw ApiException.NotFound("Không tìm thấy tour.");
        var terms = DepartureRules.Terms(input, errors);
        var days = dates(errors);
        errors.ThrowIfAny();
        if (tour.Status == AdminTourStatus.Archived) throw ApiException.Conflict("Tour đã lưu trữ, không thêm lịch.");
        await accessService.RequireManagedBranchAsync(access, terms.OperatingBranchId, ct);
        var audit = await accessService.AuditAsync(access, action, AuditEntities.Departure, ResourceId.Format(tourId),
            terms.OperatingBranchId, "", null, ct);
        try
        {
            var skipped = await repository.InsertAsync(tourId, tour.DurationDays, terms, days, created => audit with
            {
                Summary = $"Tạo {created} lịch khởi hành cho tour {tour.Code} ({Day(days[0])} – {Day(days[^1])})",
            }, ct);
            return new BulkDeparturesResultDto(days.Count - skipped.Count, skipped);
        }
        catch (MySqlException error) when (error.Number == MissingReference)
        {
            throw ApiException.BadRequest("Điểm khởi hành không tồn tại.");
        }
    }

    private async Task<(AdminAccess Access, AdminDepartureDto Departure)> ManagedAsync(Account account,
        string rawId, CancellationToken ct)
    {
        var access = await accessService.RequireManagerAsync(account, ct);
        var row = await repository.FindAsync(ResourceId.Parse(rawId, "id"), ct)
            ?? throw ApiException.NotFound(NotFound);
        AdminAccessService.EnsureCanManage(access, row.BranchId, NotFound);
        return (access, row.Departure);
    }

    private async Task<AdminDepartureDto> GetAsync(AdminAccess access, string id, CancellationToken ct)
    {
        var row = await repository.FindAsync(Id(id), ct) ?? throw ApiException.NotFound(NotFound);
        return row.Departure with { CanEdit = access.Manage.Covers(row.BranchId) };
    }

    private static Dictionary<string, object?> Fields(AdminDepartureDto d) => new()
    {
        ["operatingBranchId"] = d.BranchId, ["capacity"] = d.Capacity, ["minGuests"] = d.MinGuests,
        ["adultPrice"] = d.AdultPrice, ["childPrice"] = d.ChildPrice,
    };

    private static Dictionary<string, object?> Fields(ValidDepartureTerms t) => new()
    {
        ["operatingBranchId"] = ResourceId.Format(t.OperatingBranchId), ["capacity"] = t.Capacity,
        ["minGuests"] = t.MinGuests, ["adultPrice"] = t.AdultPrice, ["childPrice"] = t.ChildPrice,
    };

    private static string Day(DateOnly date) => date.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
    private static ulong Id(string id) => ResourceId.Parse(id, "id");
}
