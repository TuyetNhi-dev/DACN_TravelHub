using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Admin.Access;

namespace TravelHub.Api.Features.Admin.Dashboard;

public sealed record UpcomingDepartureDto(string DepartureId, string TourId, string TourCode, string TourTitle,
    DateOnly DepartureDate, string BranchName, int ReservedSeats, int MinGuests, int Capacity, bool BelowMinimum);

public sealed record RegionRevenueDto(string Code, string Name, decimal Revenue);

/// <summary>One month of the revenue chart; <c>Month</c> is "yyyy-MM" in Vietnamese time.</summary>
public sealed record MonthRevenueDto(string Month, IReadOnlyList<RegionRevenueDto> Regions);

/// <summary>"Việc cần làm": counts that each link to a filtered list.</summary>
public sealed record DashboardTodoDto(int OverduePendingItems, int NewServiceRequests, int DeparturesBelowMinimum);

public sealed record DashboardDto(int OrdersToday, decimal RevenueThisMonth, decimal RevenueLastMonth,
    decimal? RevenueChangePercent, int PendingItems, decimal? OccupancyPercent,
    IReadOnlyList<UpcomingDepartureDto> Upcoming, IReadOnlyList<RegionRevenueDto> RevenueByRegion,
    IReadOnlyList<MonthRevenueDto> RevenueSeries, DashboardTodoDto Todo);

/// <summary>Seats sold and offered over a period, for the occupancy card.</summary>
public sealed record SeatTotals(int Reserved, int Capacity);

/// <summary>Pure parts of the dashboard: Vietnamese-day boundaries, percentages and the region chart's rows.</summary>
public static class DashboardRules
{
    public const int UpcomingDays = 14;
    public const int OccupancyDays = 30;
    public const int SeriesMonths = 6;
    /// <summary>A partner request untouched this long is "quá hạn" on the to-do list.</summary>
    public const int PendingOverdueHours = 24;
    public const string OnlineCode = "ONLINE";
    public const string OnlineName = "Trực tuyến (không chi nhánh)";
    private const int Percent = 100;
    private const int PercentDecimals = 1;

    public static (DateTime Start, DateTime End) DayUtc(DateOnly day) =>
        (VietnamClock.StartOfDayUtc(day), VietnamClock.StartOfDayUtc(day.AddDays(1)));

    public static (DateTime Start, DateTime End) MonthUtc(DateOnly day)
    {
        var first = new DateOnly(day.Year, day.Month, 1);
        return (VietnamClock.StartOfDayUtc(first), VietnamClock.StartOfDayUtc(first.AddMonths(1)));
    }

    /// <summary>First day of each of the last <paramref name="count"/> months, oldest first, today's last.</summary>
    public static IReadOnlyList<DateOnly> LastMonths(DateOnly today, int count)
    {
        var current = new DateOnly(today.Year, today.Month, 1);
        return Enumerable.Range(0, count).Select(i => current.AddMonths(i - count + 1)).ToList();
    }

    /// <summary>Change against last month in percent; null when last month had no revenue (no base to compare).</summary>
    public static decimal? ChangePercent(decimal current, decimal previous) =>
        previous == 0 ? null : Math.Round((current - previous) / previous * Percent, PercentDecimals);

    /// <summary>Share of offered seats already sold; null when nothing is on sale in the period.</summary>
    public static decimal? OccupancyPercent(SeatTotals seats) =>
        seats.Capacity == 0 ? null : Math.Round((decimal)seats.Reserved / seats.Capacity * Percent, PercentDecimals);

    /// <summary>
    /// One bar per region the scope touches, zero when it sold nothing; orders without a branch (online hotels and
    /// flights) get their own bar, which only a global scope can see.
    /// </summary>
    public static IReadOnlyList<RegionRevenueDto> RegionRows(IReadOnlyDictionary<string, decimal> revenue,
        IReadOnlyList<BranchRef> branches, ScopeSet scope)
    {
        var rows = branches.Where(b => b.RegionCode is not null && scope.Covers(b.Id))
            .GroupBy(b => b.RegionCode!)
            .Select(g => new RegionRevenueDto(g.Key, g.First().RegionName ?? g.Key, revenue.GetValueOrDefault(g.Key)))
            .ToList();
        if (scope.IsGlobal)
            rows.Add(new RegionRevenueDto(OnlineCode, OnlineName, revenue.GetValueOrDefault(OnlineCode)));
        return rows;
    }

    public static string MonthKey(DateOnly firstDay) => firstDay.ToString("yyyy-MM");
}
