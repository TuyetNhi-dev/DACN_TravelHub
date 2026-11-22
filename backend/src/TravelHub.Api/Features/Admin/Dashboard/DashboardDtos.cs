using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Admin.Access;

namespace TravelHub.Api.Features.Admin.Dashboard;

public sealed record UpcomingDepartureDto(string DepartureId, string TourId, string TourCode, string TourTitle,
    DateOnly DepartureDate, string BranchName, int ReservedSeats, int MinGuests, int Capacity, bool BelowMinimum);

public sealed record RegionRevenueDto(string Code, string Name, decimal Revenue);

public sealed record DashboardDto(int OrdersToday, decimal RevenueThisMonth, int PendingItems,
    IReadOnlyList<UpcomingDepartureDto> Upcoming, IReadOnlyList<RegionRevenueDto> RevenueByRegion);

/// <summary>Pure parts of the dashboard: Vietnamese-day boundaries and the region chart's rows.</summary>
public static class DashboardRules
{
    public const int UpcomingDays = 14;
    public const string OnlineCode = "ONLINE";
    public const string OnlineName = "Trực tuyến (không chi nhánh)";

    public static (DateTime Start, DateTime End) DayUtc(DateOnly day) =>
        (VietnamClock.StartOfDayUtc(day), VietnamClock.StartOfDayUtc(day.AddDays(1)));

    public static (DateTime Start, DateTime End) MonthUtc(DateOnly day)
    {
        var first = new DateOnly(day.Year, day.Month, 1);
        return (VietnamClock.StartOfDayUtc(first), VietnamClock.StartOfDayUtc(first.AddMonths(1)));
    }

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
}
