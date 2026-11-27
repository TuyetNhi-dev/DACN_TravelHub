namespace TravelHub.Api.Features.Admin.Tours;

public sealed record AdminTourSummaryDto(string Id, string Code, string Title, string Destination, string BranchId,
    string BranchName, string Status, int DurationDays, int DurationNights, decimal BasePrice,
    int UpcomingDepartures, int ImageCount, bool CanEdit, string? CategoryName = null, string? ThumbnailUrl = null);

public sealed record AdminTourImageDto(string Url, string? AltText);

public sealed record AdminItineraryDayDto(int DayNumber, string Title, string? Description);

public sealed record AdminInclusionDto(string ServiceType, string Description, bool IsIncluded);

public sealed record AdminTourDetailDto(string Id, string Code, string Title, string DestinationId,
    string? CategoryId, string BranchId, int DurationDays, int DurationNights, decimal BasePrice,
    string? Description, string Status, IReadOnlyList<AdminTourImageDto> Images,
    IReadOnlyList<AdminItineraryDayDto> Itinerary, IReadOnlyList<AdminInclusionDto> Inclusions, bool CanEdit,
    string? CancellationPolicy = null, string? TravelNotes = null);

public sealed record SaveTourRequest(string? Code, string? Title, string? DestinationId, string? CategoryId,
    string? OperatingBranchId, int? DurationDays, int? DurationNights, decimal? BasePrice, string? Description,
    string? CancellationPolicy = null, string? TravelNotes = null);

public sealed record TourStatusRequest(string? Status);

public sealed record SaveTourImagesRequest(IReadOnlyList<AdminTourImageDto>? Images);

public sealed record ItineraryDayInput(string? Title, string? Description);

public sealed record SaveItineraryRequest(IReadOnlyList<ItineraryDayInput>? Days);

public sealed record SaveInclusionsRequest(IReadOnlyList<AdminInclusionDto>? Items);

/// <summary>A validated tour form; ids are parsed, text is trimmed.</summary>
public sealed record ValidTour(string Code, string Title, ulong DestinationId, ulong? CategoryId,
    ulong OperatingBranchId, int DurationDays, int DurationNights, decimal BasePrice, string? Description,
    string? CancellationPolicy = null, string? TravelNotes = null);

public sealed record AdminTourFilter(string? Status, string? Query, ulong? RegionId = null, ulong? BranchId = null,
    ulong? CategoryId = null, string Sort = AdminTourSort.Newest);

/// <summary>Sort keys of the tour table. Only these fixed ORDER BY clauses reach SQL, never the raw value.</summary>
public static class AdminTourSort
{
    public const string Newest = "newest";

    private static readonly IReadOnlyDictionary<string, string> OrderBy = new Dictionary<string, string>
    {
        [Newest] = "t.id DESC",
        ["code"] = "t.code, t.id",
        ["title"] = "t.title, t.id",
        ["price"] = "t.base_price, t.id",
        ["price_desc"] = "t.base_price DESC, t.id",
        ["departures"] = "upcoming DESC, t.id DESC",
    };

    public static bool IsKnown(string? sort) => sort is null || OrderBy.ContainsKey(sort);

    public static string Sql(string? sort) => OrderBy.GetValueOrDefault(sort ?? Newest, OrderBy[Newest]);
}

public static class AdminTourStatus
{
    public const string Draft = "draft";
    public const string Published = "published";
    public const string Paused = "paused";
    public const string Archived = "archived";

    public static readonly IReadOnlySet<string> All = new HashSet<string> { Draft, Published, Paused, Archived };
    /// <summary>"Ẩn" is paused; archived stays a database-only state (it hides the tour for good).</summary>
    public static readonly IReadOnlySet<string> Settable = new HashSet<string> { Draft, Published, Paused };
}

public static class InclusionTypes
{
    public static readonly IReadOnlySet<string> All =
        new HashSet<string> { "hotel", "flight", "transport", "meal", "guide", "ticket", "other" };
}
