namespace TravelHub.Api.Features.Tours;

/// <summary>
/// A seasonal or themed group of tours. CoverPlace names the location whose photos represent it;
/// TourCount counts published tours only.
/// </summary>
public sealed record TourCollectionDto(
    string Slug,
    string Name,
    string? Tagline,
    string? SeasonLabel,
    string? CoverPlace,
    int TourCount);

public sealed record TourCollectionDetailDto(TourCollectionDto Collection, IReadOnlyList<TourSummaryDto> Tours);

/// <summary>Collection row plus its database id, which stays inside the backend.</summary>
public sealed record TourCollectionRow(ulong Id, TourCollectionDto Collection);
