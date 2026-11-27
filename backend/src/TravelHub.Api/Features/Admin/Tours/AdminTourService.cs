using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Auth;
using A = TravelHub.Api.Features.Admin.Audit.AuditActions;

namespace TravelHub.Api.Features.Admin.Tours;

public sealed record AdminTourQuery(string? Scope, string? Status, string? Query, int? Page, int? PageSize,
    string? RegionId = null, string? BranchId = null, string? CategoryId = null, string? Sort = null);

/// <summary>Tour editor. Every operator reads; branch managers and admins write inside their scope.</summary>
public sealed class AdminTourService(AdminAccessService accessService, AdminTourRepository repository,
    AdminTourWriter writer, VietnamClock clock)
{
    public const int DefaultPageSize = 20;
    private const int MaxCloneAttempts = 20;
    private const int DuplicateKey = 1062;
    private const int MissingReference = 1452;
    private const string NotFound = "Không tìm thấy tour.";

    public async Task<(IReadOnlyList<AdminTourSummaryDto> Rows, int Total)> ListAsync(Account account,
        AdminTourQuery query, CancellationToken ct)
    {
        var (access, scope) = await accessService.SelectAsync(account, query.Scope, ct);
        var filter = Filter(query);
        var size = Math.Clamp(query.PageSize ?? DefaultPageSize, 1, 100);
        var (rows, total) = await repository.ListAsync(filter, scope, clock.Today,
            (Math.Max(1, query.Page ?? 1) - 1) * size, size, ct);
        return (rows.Select(r => r.Summary with { CanEdit = access.Manage.Covers(r.BranchId) }).ToList(), total);
    }

    /// <summary>Validates the list filters; ids and the sort key are checked before any SQL is built.</summary>
    private static AdminTourFilter Filter(AdminTourQuery query)
    {
        var errors = new ValidationErrors();
        errors.AddIf(query.Status is not null && !AdminTourStatus.All.Contains(query.Status), "status",
            "Trạng thái lọc không hợp lệ.");
        errors.AddIf(!AdminTourSort.IsKnown(query.Sort), "sort", "Cách sắp xếp không hợp lệ.");
        var region = OptionalId(query.RegionId, "regionId", errors);
        var branch = OptionalId(query.BranchId, "branchId", errors);
        var category = OptionalId(query.CategoryId, "categoryId", errors);
        errors.ThrowIfAny();
        var text = string.IsNullOrWhiteSpace(query.Query) ? null : query.Query.Trim();
        return new AdminTourFilter(query.Status, text, region, branch, category, query.Sort ?? AdminTourSort.Newest);
    }

    private static ulong? OptionalId(string? raw, string field, ValidationErrors errors)
    {
        if (string.IsNullOrEmpty(raw)) return null;
        if (ResourceId.TryParse(raw, out var id)) return id;
        errors.Add(field, "Mã lọc không hợp lệ.");
        return null;
    }

    public async Task<AdminTourDetailDto> GetAsync(Account account, string rawId, CancellationToken ct)
    {
        var access = await accessService.RequireAsync(account, ct);
        var tour = await LoadAsync(ResourceId.Parse(rawId, "id"), ct);
        if (!access.View.Covers(BranchOf(tour))) throw ApiException.NotFound(NotFound);
        return tour with { CanEdit = access.Manage.Covers(BranchOf(tour)) };
    }

    public async Task<AdminTourDetailDto> CreateAsync(Account account, SaveTourRequest request, CancellationToken ct)
    {
        var access = await accessService.RequireManagerAsync(account, ct);
        var tour = AdminTourValidator.Tour(request);
        await accessService.RequireManagedBranchAsync(access, tour.OperatingBranchId, ct);
        var audit = await accessService.AuditAsync(access, A.TourCreate, AuditEntities.Tour, "", tour.OperatingBranchId,
            $"Tạo tour {tour.Code} – {tour.Title}", null, ct);
        var id = await Guard(() => writer.InsertAsync(tour, newId => audit with { EntityId = Id(newId) }, ct));
        return await GetAsync(account, Id(id), ct);
    }

    public async Task<AdminTourDetailDto> UpdateAsync(Account account, string rawId, SaveTourRequest request,
        CancellationToken ct)
    {
        var (access, before) = await ManagedAsync(account, rawId, ct);
        var tour = AdminTourValidator.Tour(request);
        if (tour.OperatingBranchId != BranchOf(before))
            await accessService.RequireManagedBranchAsync(access, tour.OperatingBranchId, ct);
        var audit = await accessService.AuditAsync(access, A.TourUpdate, AuditEntities.Tour, before.Id,
            tour.OperatingBranchId, $"Sửa tour {tour.Code}", AuditChanges.Diff(Fields(before), Fields(tour)), ct);
        if (!await Guard(() => writer.UpdateAsync(Parse(before.Id), tour, audit, ct)))
            throw ApiException.NotFound(NotFound);
        return await GetAsync(account, before.Id, ct);
    }

    public async Task<AdminTourDetailDto> SetStatusAsync(Account account, string rawId, TourStatusRequest request,
        CancellationToken ct)
    {
        var (access, tour) = await ManagedAsync(account, rawId, ct);
        var status = AdminTourValidator.Status(request.Status);
        var audit = await accessService.AuditAsync(access, A.TourStatus, AuditEntities.Tour, tour.Id, BranchOf(tour),
            $"Đổi trạng thái tour {tour.Code}: {tour.Status} → {status}",
            [new AuditChange("status", tour.Status, status)], ct);
        await writer.SetStatusAsync(Parse(tour.Id), status, audit, ct);
        return await GetAsync(account, tour.Id, ct);
    }

    public async Task<AdminTourDetailDto> CloneAsync(Account account, string rawId, CancellationToken ct)
    {
        var (access, tour) = await ManagedAsync(account, rawId, ct);
        var code = await FreeCloneCodeAsync(tour.Code, ct);
        var audit = await accessService.AuditAsync(access, A.TourClone, AuditEntities.Tour, "", BranchOf(tour),
            $"Nhân bản tour {tour.Code} thành {code}", null, ct);
        var id = await Guard(() => writer.CloneAsync(Parse(tour.Id), code, n => audit with { EntityId = Id(n) }, ct));
        return await GetAsync(account, Id(id), ct);
    }

    public Task<AdminTourDetailDto> SaveImagesAsync(Account account, string rawId, SaveTourImagesRequest request,
        CancellationToken ct) => SaveChildrenAsync(account, rawId, () => AdminTourValidator.Images(request),
        A.TourImages, "ảnh", (id, items, audit) => writer.ReplaceImagesAsync(id, items, audit, ct), ct);

    public Task<AdminTourDetailDto> SaveItineraryAsync(Account account, string rawId, SaveItineraryRequest request,
        CancellationToken ct) => SaveChildrenAsync(account, rawId, () => AdminTourValidator.Itinerary(request),
        A.TourItinerary, "ngày lịch trình", (id, items, audit) => writer.ReplaceItineraryAsync(id, items, audit, ct),
        ct);

    public Task<AdminTourDetailDto> SaveInclusionsAsync(Account account, string rawId,
        SaveInclusionsRequest request, CancellationToken ct) => SaveChildrenAsync(account, rawId,
        () => AdminTourValidator.Inclusions(request), A.TourInclusions, "mục giá bao gồm/không bao gồm",
        (id, items, audit) => writer.ReplaceInclusionsAsync(id, items, audit, ct), ct);

    /// <summary>Role first (403), then the form (400), then the tour and its branch (404/403).</summary>
    private async Task<AdminTourDetailDto> SaveChildrenAsync<T>(Account account, string rawId,
        Func<IReadOnlyList<T>> validate, string action, string noun,
        Func<ulong, IReadOnlyList<T>, AuditEntry, Task> save, CancellationToken ct)
    {
        await accessService.RequireManagerAsync(account, ct);
        var items = validate();
        var (access, tour) = await ManagedAsync(account, rawId, ct);
        var audit = await accessService.AuditAsync(access, action, AuditEntities.Tour, tour.Id, BranchOf(tour),
            $"Cập nhật {items.Count} {noun} của tour {tour.Code}", null, ct);
        await save(Parse(tour.Id), items, audit);
        return await GetAsync(account, tour.Id, ct);
    }

    private async Task<(AdminAccess Access, AdminTourDetailDto Tour)> ManagedAsync(Account account, string rawId,
        CancellationToken ct)
    {
        var access = await accessService.RequireManagerAsync(account, ct);
        var tour = await LoadAsync(ResourceId.Parse(rawId, "id"), ct);
        AdminAccessService.EnsureCanManage(access, BranchOf(tour), NotFound);
        return (access, tour);
    }

    private async Task<string> FreeCloneCodeAsync(string code, CancellationToken ct)
    {
        for (var attempt = 1; attempt <= MaxCloneAttempts; attempt++)
        {
            var candidate = AdminTourValidator.CloneCode(code, attempt);
            if (!await repository.CodeExistsAsync(candidate, ct)) return candidate;
        }
        throw ApiException.Conflict("Tour này đã có quá nhiều bản sao, hãy đổi mã một bản sao cũ trước.");
    }

    private async Task<AdminTourDetailDto> LoadAsync(ulong id, CancellationToken ct) =>
        await repository.FindDetailAsync(id, ct) ?? throw ApiException.NotFound(NotFound);

    /// <summary>Maps the two MySQL errors a valid form can still hit to the shared error format.</summary>
    private static async Task<T> Guard<T>(Func<Task<T>> write)
    {
        try
        {
            return await write();
        }
        catch (MySqlException error) when (error.Number == DuplicateKey)
        {
            throw ApiException.Conflict("Mã tour đã tồn tại.");
        }
        catch (MySqlException error) when (error.Number == MissingReference)
        {
            throw ApiException.BadRequest("Điểm đến hoặc danh mục không tồn tại.");
        }
    }

    private static Dictionary<string, object?> Fields(AdminTourDetailDto t) => new()
    {
        ["code"] = t.Code, ["title"] = t.Title, ["destinationId"] = t.DestinationId, ["categoryId"] = t.CategoryId,
        ["operatingBranchId"] = t.BranchId, ["durationDays"] = t.DurationDays,
        ["durationNights"] = t.DurationNights, ["basePrice"] = t.BasePrice, ["description"] = t.Description,
        ["cancellationPolicy"] = t.CancellationPolicy, ["travelNotes"] = t.TravelNotes,
    };

    private static Dictionary<string, object?> Fields(ValidTour t) => new()
    {
        ["code"] = t.Code, ["title"] = t.Title, ["destinationId"] = Id(t.DestinationId),
        ["categoryId"] = t.CategoryId is { } c ? Id(c) : null, ["operatingBranchId"] = Id(t.OperatingBranchId),
        ["durationDays"] = t.DurationDays, ["durationNights"] = t.DurationNights, ["basePrice"] = t.BasePrice,
        ["description"] = t.Description, ["cancellationPolicy"] = t.CancellationPolicy,
        ["travelNotes"] = t.TravelNotes,
    };

    private static ulong BranchOf(AdminTourDetailDto tour) => Parse(tour.BranchId);
    private static ulong Parse(string id) => ResourceId.Parse(id, "id");
    private static string Id(ulong id) => ResourceId.Format(id);
}
