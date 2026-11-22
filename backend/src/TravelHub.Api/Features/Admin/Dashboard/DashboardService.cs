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
        var (monthStart, monthEnd) = DashboardRules.MonthUtc(today);
        var byRegion = await repository.RevenueByRegionAsync(scope, monthStart, monthEnd, ct);
        return new DashboardDto(
            await repository.OrdersCreatedAsync(scope, dayStart, dayEnd, ct),
            await repository.RevenueAsync(scope, monthStart, monthEnd, ct),
            await repository.PendingItemsAsync(scope, ct),
            await repository.UpcomingAsync(scope, today, ct),
            DashboardRules.RegionRows(byRegion, await accessService.BranchesAsync(ct), scope));
    }
}
