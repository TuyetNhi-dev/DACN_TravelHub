namespace TravelHub.Api.Features.Admin.Departures;

public sealed record AdminDepartureDto(string Id, string TourId, string TourCode, string TourTitle, string BranchId,
    string BranchName, string DepartureLocationId, string DepartureFrom, DateOnly DepartureDate, DateOnly ReturnDate,
    int Capacity, int ReservedSeats, int MinGuests, decimal AdultPrice, decimal? ChildPrice, string Status,
    bool CanEdit, int ActiveBookings = 0, string? CancelReason = null);

/// <summary>Fields shared by one-day and weekly creation.</summary>
public sealed record DepartureTermsInput(string? DepartureLocationId, string? OperatingBranchId, int? Capacity,
    int? MinGuests, decimal? AdultPrice, decimal? ChildPrice);

public sealed record CreateDepartureRequest(DateOnly? DepartureDate, string? DepartureLocationId,
    string? OperatingBranchId, int? Capacity, int? MinGuests, decimal? AdultPrice, decimal? ChildPrice)
{
    public DepartureTermsInput Terms => new(DepartureLocationId, OperatingBranchId, Capacity, MinGuests, AdultPrice,
        ChildPrice);
}

/// <summary>Weekdays use .NET's numbering: 0 = Sunday … 6 = Saturday.</summary>
public sealed record BulkDeparturesRequest(DateOnly? FromDate, DateOnly? ToDate, IReadOnlyList<int>? Weekdays,
    string? DepartureLocationId, string? OperatingBranchId, int? Capacity, int? MinGuests, decimal? AdultPrice,
    decimal? ChildPrice)
{
    public DepartureTermsInput Terms => new(DepartureLocationId, OperatingBranchId, Capacity, MinGuests, AdultPrice,
        ChildPrice);
}

public sealed record UpdateDepartureRequest(string? OperatingBranchId, int? Capacity, int? MinGuests,
    decimal? AdultPrice, decimal? ChildPrice);

/// <summary>Reason is required when cancelling; it is shown to staff and kept in the audit log.</summary>
public sealed record DepartureStatusRequest(string? Status, string? Reason = null);

public sealed record BulkDeparturesResultDto(int Created, IReadOnlyList<DateOnly> SkippedDates);

public sealed record ValidDepartureTerms(ulong DepartureLocationId, ulong OperatingBranchId, int Capacity,
    int MinGuests, decimal AdultPrice, decimal? ChildPrice);

public sealed record AdminDepartureFilter(ulong? TourId, DateOnly? From, DateOnly? To, string? Status,
    ulong? BranchId = null);

/// <summary>
/// Life of a departure: open (on sale) ⇄ closed (sale paused) → guaranteed ("chốt đoàn", no more sales) →
/// in_progress (on the road) → completed; any state before in_progress may end in cancelled (migration 016).
/// </summary>
public static class DepartureStatus
{
    public const string Open = "open";
    public const string Closed = "closed";
    public const string Guaranteed = "guaranteed";
    public const string InProgress = "in_progress";
    public const string Completed = "completed";
    public const string Cancelled = "cancelled";

    public static readonly IReadOnlySet<string> All =
        new HashSet<string> { Open, Closed, Guaranteed, InProgress, Completed, Cancelled };

    /// <summary>Allowed next states; completed and cancelled are final.</summary>
    public static readonly IReadOnlyDictionary<string, IReadOnlySet<string>> Next =
        new Dictionary<string, IReadOnlySet<string>>
        {
            [Open] = new HashSet<string> { Closed, Guaranteed, Cancelled },
            [Closed] = new HashSet<string> { Open, Guaranteed, Cancelled },
            [Guaranteed] = new HashSet<string> { InProgress, Cancelled },
            [InProgress] = new HashSet<string> { Completed },
            [Completed] = new HashSet<string>(),
            [Cancelled] = new HashSet<string>(),
        };
}
