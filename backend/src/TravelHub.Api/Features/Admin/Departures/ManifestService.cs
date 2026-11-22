using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin.Departures;

/// <summary>Group list of a departure for every operator whose scope covers its running branch.</summary>
public sealed class ManifestService(AdminAccessService accessService, AdminDepartureRepository departures,
    ManifestRepository manifests, ILogger<ManifestService> logger)
{
    public async Task<ManifestDto> GetAsync(Account account, string rawId, CancellationToken ct)
    {
        var access = await accessService.RequireAsync(account, ct);
        var id = ResourceId.Parse(rawId, "id");
        var row = await departures.FindAsync(id, ct);
        if (row is null || !access.View.Covers(row.BranchId))
            throw ApiException.NotFound("Không tìm thấy lịch khởi hành.");
        var bookings = await manifests.ListBookingsAsync(id, ct);
        return new ManifestDto(row.Departure with { CanEdit = access.Manage.Covers(row.BranchId) }, bookings,
            bookings.Sum(b => b.Adults + b.Children));
    }

    public async Task<(byte[] Content, string FileName)> ExportAsync(Account account, string rawId,
        CancellationToken ct)
    {
        var manifest = await GetAsync(account, rawId, ct);
        // The file holds passengers' personal data: record who exported it, never what it contains.
        logger.LogInformation("Manifest of departure {DepartureId} exported by user {UserId}",
            manifest.Departure.Id, account.User.Id);
        return (ManifestExcel.Build(manifest), ManifestExcel.FileName(manifest.Departure));
    }
}
