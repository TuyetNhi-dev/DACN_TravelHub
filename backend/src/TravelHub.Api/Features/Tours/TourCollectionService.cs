using System.Text.RegularExpressions;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Time;

namespace TravelHub.Api.Features.Tours;

public sealed partial class TourCollectionService(
    TourCollectionRepository collections, TourRepository tours, VietnamClock clock)
{
    private const int MaxSlugLength = 80;

    public Task<IReadOnlyList<TourCollectionDto>> ListAsync(CancellationToken ct) => collections.ListActiveAsync(ct);

    public async Task<TourCollectionDetailDto> GetAsync(string slug, CancellationToken ct)
    {
        // Same rule as the CHECK constraint in migrations/006, so malformed slugs never reach SQL.
        if (slug.Length > MaxSlugLength || !Slug().IsMatch(slug))
            throw ApiException.NotFound("Bộ sưu tập tour không tồn tại.");
        var row = await collections.FindActiveAsync(slug, ct)
            ?? throw ApiException.NotFound("Bộ sưu tập tour không tồn tại hoặc đã kết thúc.");
        var items = await tours.ListByCollectionAsync(row.Id, clock.Today, ct);
        return new TourCollectionDetailDto(row.Collection, items);
    }

    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex Slug();
}
