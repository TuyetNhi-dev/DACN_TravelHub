using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Auth;
using L = TravelHub.Api.Features.ServiceRequests.ServiceRequestLimits;

namespace TravelHub.Api.Features.ServiceRequests;

/// <summary>
/// Back-office follow-up of consultation requests. They belong to no branch, so every operator works the same
/// national queue (decision 003, Q3). Each change is written to the audit log.
/// </summary>
public sealed class AdminServiceRequestService(ServiceRequestRepository repository, AdminAccessService accessService,
    VietnamClock clock)
{
    private const string NotFoundMessage = "Không tìm thấy yêu cầu tư vấn.";

    public async Task<(IReadOnlyList<ServiceRequestSummaryDto> Rows, int Total)> ListAsync(Account account,
        string? query, string? serviceType, string? status, int? page, int? pageSize, CancellationToken ct)
    {
        await accessService.RequireAsync(account, ct);
        var filter = ServiceRequestValidator.Filter(query, serviceType, status);
        var size = Math.Clamp(pageSize ?? L.DefaultPageSize, 1, L.MaxPageSize);
        var offset = (Math.Max(1, page ?? 1) - 1) * size;
        return await repository.ListAsync(filter, offset, size, ct);
    }

    /// <summary>Requests still waiting for a first contact; shown as a badge next to the admin menu item.</summary>
    public async Task<ServiceRequestCountDto> CountNewAsync(Account account, CancellationToken ct)
    {
        await accessService.RequireAsync(account, ct);
        return new ServiceRequestCountDto(await repository.CountByStatusAsync(ServiceRequestStatus.New, ct));
    }

    public async Task<ServiceRequestDetailDto> GetAsync(Account account, string rawId, CancellationToken ct)
    {
        await accessService.RequireAsync(account, ct);
        return await LoadAsync(ResourceId.Parse(rawId, "id"), ct);
    }

    public async Task<ServiceRequestDetailDto> UpdateStatusAsync(Account account, string rawId,
        UpdateServiceRequestStatusRequest request, CancellationToken ct)
    {
        var (access, id) = await StartAsync(account, rawId, ct);
        var status = ServiceRequestValidator.Status(request.Status);
        var audit = await AuditAsync(access, AuditActions.RequestStatus, id,
            $"Đổi trạng thái yêu cầu #{id} thành {status}", ct);
        if (!await repository.UpdateStatusAsync(id, status, audit, ct)) throw ApiException.NotFound(NotFoundMessage);
        return await LoadAsync(id, ct);
    }

    public async Task<ServiceRequestDetailDto> AddNoteAsync(Account account, string rawId,
        AddServiceRequestNoteRequest request, CancellationToken ct)
    {
        var (access, id) = await StartAsync(account, rawId, ct);
        var note = ServiceRequestValidator.InternalNote(request.Note);
        // The note itself stays in service_request_notes; the log only says one was added.
        var audit = await AuditAsync(access, AuditActions.RequestNote, id, $"Thêm ghi chú cho yêu cầu #{id}", ct);
        if (!await repository.AddNoteAsync(id, access.UserId, note, clock.UtcNow, audit, ct))
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
        var (access, id) = await StartAsync(account, rawId, ct);
        var audit = await AuditAsync(access, AuditActions.RequestAssign, id,
            assignToMe ? $"Nhận xử lý yêu cầu #{id}" : $"Bỏ nhận yêu cầu #{id}", ct);
        if (!await repository.AssignAsync(id, assignToMe ? access.UserId : null, audit, ct))
            throw ApiException.NotFound(NotFoundMessage);
        return await LoadAsync(id, ct);
    }

    private async Task<(AdminAccess Access, ulong Id)> StartAsync(Account account, string rawId,
        CancellationToken ct) =>
        (await accessService.RequireAsync(account, ct), ResourceId.Parse(rawId, "id"));

    private Task<AuditEntry> AuditAsync(AdminAccess access, string action, ulong id, string summary,
        CancellationToken ct) => accessService.AuditAsync(access, action, AuditEntities.ServiceRequest,
        ResourceId.Format(id), null, summary, null, ct);

    private async Task<ServiceRequestDetailDto> LoadAsync(ulong id, CancellationToken ct) =>
        await repository.FindAsync(id, ct) ?? throw ApiException.NotFound(NotFoundMessage);
}
