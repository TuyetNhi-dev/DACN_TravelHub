using System.Globalization;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Admin;
using TravelHub.Api.Features.Auth;
using L = TravelHub.Api.Features.ServiceRequests.ServiceRequestLimits;

namespace TravelHub.Api.Features.ServiceRequests;

/// <summary>Back-office follow-up of consultation requests. STAFF and ADMIN only (checked before any query).</summary>
public sealed class AdminServiceRequestService(ServiceRequestRepository repository, VietnamClock clock)
{
    private const string NotFoundMessage = "Không tìm thấy yêu cầu tư vấn.";

    public async Task<(IReadOnlyList<ServiceRequestSummaryDto> Rows, int Total)> ListAsync(Account account,
        string? query, string? serviceType, string? status, int? page, int? pageSize, CancellationToken ct)
    {
        RequireOperator(account);
        var filter = ServiceRequestValidator.Filter(query, serviceType, status);
        var size = Math.Clamp(pageSize ?? L.DefaultPageSize, 1, L.MaxPageSize);
        var offset = (Math.Max(1, page ?? 1) - 1) * size;
        return await repository.ListAsync(filter, offset, size, ct);
    }

    /// <summary>Requests still waiting for a first contact; shown as a badge next to the admin menu item.</summary>
    public async Task<ServiceRequestCountDto> CountNewAsync(Account account, CancellationToken ct)
    {
        RequireOperator(account);
        return new ServiceRequestCountDto(await repository.CountByStatusAsync(ServiceRequestStatus.New, ct));
    }

    public async Task<ServiceRequestDetailDto> GetAsync(Account account, string rawId, CancellationToken ct)
    {
        RequireOperator(account);
        return await LoadAsync(ResourceId.Parse(rawId, "id"), ct);
    }

    public async Task<ServiceRequestDetailDto> UpdateStatusAsync(Account account, string rawId,
        UpdateServiceRequestStatusRequest request, CancellationToken ct)
    {
        RequireOperator(account);
        var id = ResourceId.Parse(rawId, "id");
        var status = ServiceRequestValidator.Status(request.Status);
        if (!await repository.UpdateStatusAsync(id, status, ct)) throw ApiException.NotFound(NotFoundMessage);
        return await LoadAsync(id, ct);
    }

    public async Task<ServiceRequestDetailDto> AddNoteAsync(Account account, string rawId,
        AddServiceRequestNoteRequest request, CancellationToken ct)
    {
        RequireOperator(account);
        var id = ResourceId.Parse(rawId, "id");
        var note = ServiceRequestValidator.InternalNote(request.Note);
        if (!await repository.AddNoteAsync(id, UserId(account), note, clock.UtcNow, ct))
            throw ApiException.NotFound(NotFoundMessage);
        return await LoadAsync(id, ct);
    }

    /// <summary>"Nhận xử lý": the signed-in staff member takes the request (replacing any previous assignee).</summary>
    public Task<ServiceRequestDetailDto> AssignToMeAsync(Account account, string rawId, CancellationToken ct) =>
        AssignAsync(account, rawId, assignToMe: true, ct);

    /// <summary>"Bỏ nhận": clears the assignee.</summary>
    public Task<ServiceRequestDetailDto> UnassignAsync(Account account, string rawId, CancellationToken ct) =>
        AssignAsync(account, rawId, assignToMe: false, ct);

    private async Task<ServiceRequestDetailDto> AssignAsync(Account account, string rawId, bool assignToMe,
        CancellationToken ct)
    {
        RequireOperator(account);
        var id = ResourceId.Parse(rawId, "id");
        if (!await repository.AssignAsync(id, assignToMe ? UserId(account) : null, ct))
            throw ApiException.NotFound(NotFoundMessage);
        return await LoadAsync(id, ct);
    }

    private async Task<ServiceRequestDetailDto> LoadAsync(ulong id, CancellationToken ct) =>
        await repository.FindAsync(id, ct) ?? throw ApiException.NotFound(NotFoundMessage);

    private static void RequireOperator(Account account)
    {
        if (StaffScope.From(account.User) is null)
            throw ApiException.Forbidden("Bạn không có quyền truy cập trang quản trị.");
    }

    private static ulong UserId(Account account) => ulong.Parse(account.User.Id, CultureInfo.InvariantCulture);
}
