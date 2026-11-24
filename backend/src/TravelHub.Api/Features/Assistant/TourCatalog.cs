using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Features.Assistant;

/// <summary>The tour search the assistant may use; an interface so tool dispatch is tested without MySQL.</summary>
public interface ITourCatalog
{
    /// <exception cref="Common.Errors.ApiValidationException">The filters break the public search rules.</exception>
    Task<IReadOnlyList<TourSummaryDto>> SearchAsync(TourSearchQuery query, CancellationToken ct);
}

/// <summary>Same search as GET /api/tours (first page, same rules): the assistant sees what /tours shows.</summary>
public sealed class TourCatalog(TourService tours) : ITourCatalog
{
    public async Task<IReadOnlyList<TourSummaryDto>> SearchAsync(TourSearchQuery query, CancellationToken ct) =>
        (await tours.ListPagedAsync(query, 1, AssistantRules.ToursPerSearch, ct)).Rows;
}
