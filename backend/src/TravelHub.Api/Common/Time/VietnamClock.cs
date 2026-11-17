namespace TravelHub.Api.Common.Time;

/// <summary>
/// Business dates (departure days, check-in nights) are Vietnamese calendar dates, while stored
/// timestamps are UTC. This clock converts between the two in one place.
/// </summary>
public sealed class VietnamClock(TimeProvider timeProvider)
{
    private static readonly TimeZoneInfo VietnamZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

    public DateTime UtcNow => timeProvider.GetUtcNow().UtcDateTime;

    public DateOnly Today => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(UtcNow, VietnamZone));

    public static DateOnly ToVietnamDate(DateTime utc) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), VietnamZone));

    /// <summary>UTC instant at which the given Vietnamese calendar day starts.</summary>
    public static DateTime StartOfDayUtc(DateOnly day) =>
        TimeZoneInfo.ConvertTimeToUtc(day.ToDateTime(TimeOnly.MinValue), VietnamZone);
}
