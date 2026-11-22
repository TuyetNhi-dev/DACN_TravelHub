using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin.Audit;

public sealed record AuditLogQuery(string? Scope, string? EntityType, string? ActorId, DateOnly? From, DateOnly? To,
    int? Page, int? PageSize);

/// <summary>Read-only view of audit_logs for branch managers (their branches) and admins (everything).</summary>
public sealed class AuditLogService(AdminAccessService accessService, AuditLogRepository repository)
{
    public const int DefaultPageSize = 30;
    public const int MaxPageSize = 100;

    public async Task<(IReadOnlyList<AuditLogDto> Rows, int Total)> ListAsync(Account account, AuditLogQuery query,
        CancellationToken ct)
    {
        var (access, scope) = await accessService.SelectAsync(account, query.Scope, ct);
        if (!access.CanViewAudit)
            throw ApiException.Forbidden("Chỉ quản lý chi nhánh hoặc quản trị viên được xem nhật ký thao tác.");
        // A manager who is also global STAFF still only reads the log of the branches they manage.
        var filter = Filter(query, scope.Intersect(access.Manage));
        var size = Math.Clamp(query.PageSize ?? DefaultPageSize, 1, MaxPageSize);
        var offset = (Math.Max(1, query.Page ?? 1) - 1) * size;
        return await repository.ListAsync(filter, offset, size, ct);
    }

    private static AuditLogFilter Filter(AuditLogQuery query, ScopeSet scope)
    {
        var errors = new ValidationErrors();
        errors.AddIf(query.EntityType is not null && !AuditEntities.All.Contains(query.EntityType), "entityType",
            "Loại đối tượng không hợp lệ.");
        errors.AddIf(query.ActorId is not null && !ResourceId.TryParse(query.ActorId, out _), "actorId",
            "Mã người thao tác không hợp lệ.");
        errors.AddIf(query.From > query.To, "to", "Ngày kết thúc phải sau ngày bắt đầu.");
        errors.ThrowIfAny();
        ulong? actor = query.ActorId is null ? null : ResourceId.Parse(query.ActorId, "actorId");
        return new AuditLogFilter(scope, query.EntityType, actor,
            query.From is { } from ? VietnamClock.StartOfDayUtc(from) : null,
            query.To is { } to ? VietnamClock.StartOfDayUtc(to.AddDays(1)) : null);
    }
}
