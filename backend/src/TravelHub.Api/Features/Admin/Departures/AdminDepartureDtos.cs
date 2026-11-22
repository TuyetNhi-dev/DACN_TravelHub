namespace TravelHub.Api.Features.Admin.Departures;

public sealed record AdminDepartureDto(string Id, string TourId, string TourCode, string TourTitle, string BranchId,
    string BranchName, string DepartureLocationId, string DepartureFrom, DateOnly DepartureDate, DateOnly ReturnDate,
    int Capacity, int ReservedSeats, int MinGuests, decimal AdultPrice, decimal? ChildPrice, string Status,
    bool CanEdit);

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

public sealed record DepartureStatusRequest(string? Status);

public sealed record BulkDeparturesResultDto(int Created, IReadOnlyList<DateOnly> SkippedDates);

public sealed record ValidDepartureTerms(ulong DepartureLocationId, ulong OperatingBranchId, int Capacity,
    int MinGuests, decimal AdultPrice, decimal? ChildPrice);

public sealed record AdminDepartureFilter(ulong? TourId, DateOnly? From, DateOnly? To, string? Status);

public static class DepartureStatus
{
    public const string Open = "open";
    public const string Closed = "closed";
    public const string Cancelled = "cancelled";

    public static readonly IReadOnlySet<string> All = new HashSet<string> { Open, Closed, Cancelled };
    public static readonly IReadOnlySet<string> Settable = new HashSet<string> { Open, Closed };
}
