using System.Text;
using MySqlConnector;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin.Access;

namespace TravelHub.Api.Features.Admin.Dashboard;

/// <summary>Dashboard figures; orders count by selling branch, departures by running branch.</summary>
public sealed class DashboardRepository(MySqlConnectionFactory connections)
{
    public Task<int> OrdersCreatedAsync(ScopeSet scope, DateTime start, DateTime end, CancellationToken ct) =>
        ScalarAsync("SELECT COUNT(*) FROM bookings b WHERE b.created_at >= @start AND b.created_at < @end", scope,
            "b.selling_branch_id", ct, v => Convert.ToInt32(v), ("@start", start), ("@end", end));

    public Task<int> PendingItemsAsync(ScopeSet scope, CancellationToken ct) =>
        ScalarAsync("SELECT COUNT(*) FROM booking_items i JOIN bookings b ON b.id = i.booking_id "
            + "WHERE i.status = 'awaiting_supplier'", scope, "b.selling_branch_id", ct, v => Convert.ToInt32(v));

    /// <summary>Partner requests still waiting although the order was placed before <paramref name="before"/>.</summary>
    public Task<int> OverduePendingItemsAsync(ScopeSet scope, DateTime before, CancellationToken ct) =>
        ScalarAsync("SELECT COUNT(*) FROM booking_items i JOIN bookings b ON b.id = i.booking_id "
            + "WHERE i.status = 'awaiting_supplier' AND b.created_at < @before", scope, "b.selling_branch_id", ct,
            v => Convert.ToInt32(v), ("@before", before));

    /// <summary>Service requests are one shared queue (admin-spec Q3), so this count ignores the branch scope.</summary>
    public Task<int> NewServiceRequestsAsync(CancellationToken ct) =>
        ScalarAsync("SELECT COUNT(*) FROM service_requests WHERE status = 'new'", ScopeSet.Everything, "", ct,
            v => Convert.ToInt32(v));

    /// <summary>Seats sold and offered on departures still running in (today, until], for the occupancy card.</summary>
    public async Task<SeatTotals> SeatTotalsAsync(ScopeSet scope, DateOnly today, DateOnly until, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand { Connection = connection };
        var sql = new StringBuilder("""
            SELECT COALESCE(SUM(d.reserved_seats), 0) AS reserved, COALESCE(SUM(d.capacity), 0) AS capacity
            FROM tour_departures d
            WHERE d.status IN ('open', 'closed', 'guaranteed') AND d.departure_date > @today
                AND d.departure_date <= @until
            """);
        ScopeSql.AppendBranchFilter(sql, command, "d.operating_branch_id", scope);
        command.CommandText = sql.ToString();
        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@until", until);
        await using var reader = await command.ExecuteReaderAsync(ct);
        await reader.ReadAsync(ct);
        return new SeatTotals(Convert.ToInt32(reader["reserved"]), Convert.ToInt32(reader["capacity"]));
    }

    /// <summary>Region code (or ONLINE for orders without a branch) → revenue paid in the period.</summary>
    public async Task<IReadOnlyDictionary<string, decimal>> RevenueByRegionAsync(ScopeSet scope, DateTime start,
        DateTime end, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand { Connection = connection };
        var sql = new StringBuilder("""
            SELECT COALESCE(r.code, @online) AS region, SUM(p.amount) AS revenue
            FROM payments p
            JOIN bookings b ON b.id = p.booking_id
            LEFT JOIN branches br ON br.id = b.selling_branch_id
            LEFT JOIN regions r ON r.id = br.region_id
            WHERE p.status = 'succeeded' AND p.paid_at >= @start AND p.paid_at < @end
            """);
        ScopeSql.AppendBranchFilter(sql, command, "b.selling_branch_id", scope);
        command.CommandText = sql.Append(" GROUP BY COALESCE(r.code, @online)").ToString();
        command.Parameters.AddWithValue("@online", DashboardRules.OnlineCode);
        command.Parameters.AddWithValue("@start", start);
        command.Parameters.AddWithValue("@end", end);
        var rows = await command.ReadAllAsync(r => (r.GetString("region"), r.GetDecimal("revenue")), ct);
        return rows.ToDictionary(row => row.Item1, row => row.Item2);
    }

    public async Task<IReadOnlyList<UpcomingDepartureDto>> UpcomingAsync(ScopeSet scope, DateOnly today,
        CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand { Connection = connection };
        var sql = new StringBuilder("""
            SELECT d.id, d.tour_id, t.code, t.title, d.departure_date, b.name AS branch_name, d.reserved_seats,
                d.min_guests, d.capacity
            FROM tour_departures d JOIN tours t ON t.id = d.tour_id JOIN branches b ON b.id = d.operating_branch_id
            WHERE d.status IN ('open', 'closed', 'guaranteed') AND d.departure_date > @today
                AND d.departure_date <= @until
            """);
        ScopeSql.AppendBranchFilter(sql, command, "d.operating_branch_id", scope);
        command.CommandText = sql.Append(" ORDER BY d.departure_date, d.id LIMIT 30").ToString();
        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@until", today.AddDays(DashboardRules.UpcomingDays));
        return await command.ReadAllAsync(r => new UpcomingDepartureDto(r.GetId("id"), r.GetId("tour_id"),
            r.GetString("code"), r.GetString("title"), r.GetDateOnly("departure_date"), r.GetString("branch_name"),
            r.GetInt32("reserved_seats"), r.GetInt32("min_guests"), r.GetInt32("capacity"),
            r.GetInt32("reserved_seats") < r.GetInt32("min_guests")), ct);
    }

    private async Task<T> ScalarAsync<T>(string sql, ScopeSet scope, string branchColumn, CancellationToken ct,
        Func<object, T> convert, params (string Name, object Value)[] parameters)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand { Connection = connection };
        var text = new StringBuilder(sql);
        ScopeSql.AppendBranchFilter(text, command, branchColumn, scope);
        command.CommandText = text.ToString();
        foreach (var (name, value) in parameters) command.Parameters.AddWithValue(name, value);
        return convert(await command.ExecuteScalarAsync(ct) ?? 0);
    }
}
