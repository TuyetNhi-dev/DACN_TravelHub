using System.Globalization;

namespace TravelHub.Api.Features.Admin.Audit;

/// <summary>One changed field, values already formatted as text for the log.</summary>
public sealed record AuditChange(string Field, string? Old, string? New);

/// <summary>A row of audit_logs, written in the transaction of the change it describes.</summary>
public sealed record AuditEntry(ulong ActorId, string Action, string EntityType, string EntityId, ulong? BranchId,
    ulong? RegionId, string Summary, IReadOnlyList<AuditChange>? Changes);

public static class AuditEntities
{
    public const string Tour = "tour";
    public const string Departure = "departure";
    public const string Booking = "booking";
    public const string ServiceRequest = "service_request";
    public const string StaffAssignment = "staff_assignment";

    public static readonly IReadOnlySet<string> All =
        new HashSet<string> { Tour, Departure, Booking, ServiceRequest, StaffAssignment };
}

public static class AuditActions
{
    public const string TourCreate = "tour.create";
    public const string TourUpdate = "tour.update";
    public const string TourStatus = "tour.status";
    public const string TourClone = "tour.clone";
    public const string TourImages = "tour.images";
    public const string TourItinerary = "tour.itinerary";
    public const string TourInclusions = "tour.inclusions";
    public const string DepartureCreate = "departure.create";
    public const string DepartureBulkCreate = "departure.bulk_create";
    public const string DepartureUpdate = "departure.update";
    public const string DepartureStatus = "departure.status";
    public const string BookingConfirm = "booking.confirm";
    public const string BookingReject = "booking.reject";
    public const string BookingComplete = "booking.complete";
    public const string RequestStatus = "service_request.status";
    public const string RequestNote = "service_request.note";
    public const string RequestAssign = "service_request.assign";
    public const string StaffAssign = "staff.assign";
    public const string StaffRevoke = "staff.revoke";
}

/// <summary>Builds the "what changed" part of an entry from two snapshots of the same fields.</summary>
public static class AuditChanges
{
    // Defence in depth: no caller passes these, but a secret must never end up in a log row.
    private static readonly string[] SensitiveFragments = ["password", "hash", "token", "secret"];

    /// <summary>Only fields whose value differs, in the order of <paramref name="after"/>; null when none.</summary>
    public static IReadOnlyList<AuditChange>? Diff(IReadOnlyDictionary<string, object?> before,
        IReadOnlyDictionary<string, object?> after)
    {
        var changes = after
            .Where(pair => !IsSensitive(pair.Key))
            .Select(pair => new AuditChange(pair.Key, Text(before.GetValueOrDefault(pair.Key)), Text(pair.Value)))
            .Where(change => change.Old != change.New)
            .ToList();
        return changes.Count == 0 ? null : changes;
    }

    public static string? Text(object? value) => value switch
    {
        null => null,
        decimal number => number.ToString("0.##", CultureInfo.InvariantCulture),
        DateOnly date => date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        bool flag => flag ? "true" : "false",
        IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture),
        _ => value.ToString(),
    };

    private static bool IsSensitive(string field) =>
        SensitiveFragments.Any(fragment => field.Contains(fragment, StringComparison.OrdinalIgnoreCase));
}
