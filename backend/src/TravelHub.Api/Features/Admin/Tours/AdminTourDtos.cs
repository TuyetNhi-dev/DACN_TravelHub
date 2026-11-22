namespace TravelHub.Api.Features.Admin.Tours;

public sealed record AdminTourSummaryDto(string Id, string Code, string Title, string Destination, string BranchId,
    string BranchName, string Status, int DurationDays, int DurationNights, decimal BasePrice,
    int UpcomingDepartures, int ImageCount, bool CanEdit);

public sealed record AdminTourImageDto(string Url, string? AltText);

public sealed record AdminItineraryDayDto(int DayNumber, string Title, string? Description);

public sealed record AdminInclusionDto(string ServiceType, string Description, bool IsIncluded);

public sealed record AdminTourDetailDto(string Id, string Code, string Title, string DestinationId,
    string? CategoryId, string BranchId, int DurationDays, int DurationNights, decimal BasePrice,
    string? Description, string Status, IReadOnlyList<AdminTourImageDto> Images,
    IReadOnlyList<AdminItineraryDayDto> Itinerary, IReadOnlyList<AdminInclusionDto> Inclusions, bool CanEdit);

public sealed record SaveTourRequest(string? Code, string? Title, string? DestinationId, string? CategoryId,
    string? OperatingBranchId, int? DurationDays, int? DurationNights, decimal? BasePrice, string? Description);

public sealed record TourStatusRequest(string? Status);

public sealed record SaveTourImagesRequest(IReadOnlyList<AdminTourImageDto>? Images);

public sealed record ItineraryDayInput(string? Title, string? Description);

public sealed record SaveItineraryRequest(IReadOnlyList<ItineraryDayInput>? Days);

public sealed record SaveInclusionsRequest(IReadOnlyList<AdminInclusionDto>? Items);

/// <summary>A validated tour form; ids are parsed, text is trimmed.</summary>
public sealed record ValidTour(string Code, string Title, ulong DestinationId, ulong? CategoryId,
    ulong OperatingBranchId, int DurationDays, int DurationNights, decimal BasePrice, string? Description);

public sealed record AdminTourFilter(string? Status, string? Query);

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
