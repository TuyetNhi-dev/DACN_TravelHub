using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Admin.Dashboard;

public sealed class DashboardService(AdminAccessService accessService, DashboardRepository repository,
    VietnamClock clock)
{
    public async Task<DashboardDto> GetAsync(Account account, string? scopeValue, CancellationToken ct)
    {
        var (_, scope) = await accessService.SelectAsync(account, scopeValue, ct);
        var today = clock.Today;
        var (dayStart, dayEnd) = DashboardRules.DayUtc(today);
        var branches = await accessService.BranchesAsync(ct);
        var series = await SeriesAsync(scope, today, branches, ct);
        var thisMonth = series[^1].Regions.Sum(r => r.Revenue);
        var lastMonth = series[^2].Regions.Sum(r => r.Revenue);
        var upcoming = await repository.UpcomingAsync(scope, today, ct);
        var seats = await repository.SeatTotalsAsync(scope, today, today.AddDays(DashboardRules.OccupancyDays), ct);
        var todo = new DashboardTodoDto(
            await repository.OverduePendingItemsAsync(scope,
                clock.UtcNow.AddHours(-DashboardRules.PendingOverdueHours), ct),
            await repository.NewServiceRequestsAsync(ct),
            upcoming.Count(d => d.BelowMinimum));
        return new DashboardDto(
            await repository.OrdersCreatedAsync(scope, dayStart, dayEnd, ct), thisMonth, lastMonth,
            DashboardRules.ChangePercent(thisMonth, lastMonth), await repository.PendingItemsAsync(scope, ct),
            DashboardRules.OccupancyPercent(seats), upcoming, series[^1].Regions, series, todo);
    }

    /// <summary>Revenue per region for each of the last six months, oldest first (this month last).</summary>
    private async Task<IReadOnlyList<MonthRevenueDto>> SeriesAsync(ScopeSet scope, DateOnly today,
        IReadOnlyList<BranchRef> branches, CancellationToken ct)
    {
        var months = new List<MonthRevenueDto>();
        foreach (var first in DashboardRules.LastMonths(today, DashboardRules.SeriesMonths))
        {
            var (start, end) = DashboardRules.MonthUtc(first);
            var revenue = await repository.RevenueByRegionAsync(scope, start, end, ct);
            months.Add(new MonthRevenueDto(DashboardRules.MonthKey(first),
                DashboardRules.RegionRows(revenue, branches, scope)));
        }
        return months;
    }
}
