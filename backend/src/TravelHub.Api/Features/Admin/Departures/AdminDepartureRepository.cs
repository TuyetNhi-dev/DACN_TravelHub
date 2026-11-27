using System.Text;
using MySqlConnector;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;

namespace TravelHub.Api.Features.Admin.Departures;

public sealed record AdminDepartureRow(AdminDepartureDto Departure, ulong BranchId);

public sealed record DepartureTourInfo(string Code, string Title, int DurationDays, string Status);

public sealed class AdminDepartureRepository(MySqlConnectionFactory connections)
{
    private const string Select = """
        SELECT d.id, d.tour_id, t.code AS tour_code, t.title AS tour_title, d.operating_branch_id,
            b.name AS branch_name, d.departure_location_id, l.name AS departure_from, d.departure_date, d.return_date,
            d.capacity, d.reserved_seats, d.min_guests, d.adult_price, d.child_price, d.status, d.cancel_reason,
            (SELECT COUNT(*) FROM tour_booking_details td JOIN booking_items i ON i.id = td.booking_item_id
             WHERE td.tour_departure_id = d.id AND i.status NOT IN ('cancelled', 'failed')) AS active_bookings
        FROM tour_departures d
        JOIN tours t ON t.id = d.tour_id
        JOIN branches b ON b.id = d.operating_branch_id
        JOIN locations l ON l.id = d.departure_location_id
        """;

    public async Task<(IReadOnlyList<AdminDepartureRow> Rows, int Total)> ListAsync(AdminDepartureFilter filter,
        ScopeSet scope, int offset, int limit, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var count = new MySqlCommand { Connection = connection };
        count.CommandText = "SELECT COUNT(*) FROM tour_departures d" + Where(filter, scope, count);
        var total = Convert.ToInt32(await count.ExecuteScalarAsync(ct));
        await using var command = new MySqlCommand { Connection = connection };
        command.CommandText = Select + Where(filter, scope, command)
            + " ORDER BY d.departure_date, d.id LIMIT @limit OFFSET @offset";
        command.Parameters.AddWithValue("@limit", limit);
        command.Parameters.AddWithValue("@offset", offset);
        return (await command.ReadAllAsync(Read, ct), total);
    }

    public async Task<AdminDepartureRow?> FindAsync(ulong id, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(Select + " WHERE d.id = @id", connection);
        command.Parameters.AddWithValue("@id", id);
        return await command.ReadSingleAsync(Read, ct);
    }

    public async Task<DepartureTourInfo?> FindTourAsync(ulong tourId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(
            "SELECT code, title, duration_days, status FROM tours WHERE id = @id", connection);
        command.Parameters.AddWithValue("@id", tourId);
        return await command.ReadSingleAsync(r => new DepartureTourInfo(r.GetString("code"), r.GetString("title"),
            r.GetInt32("duration_days"), r.GetString("status")), ct);
    }

    /// <summary>Inserts the dates not taken yet for this tour and departure point; returns the skipped ones.</summary>
    public Task<IReadOnlyList<DateOnly>> InsertAsync(ulong tourId, int durationDays, ValidDepartureTerms terms,
        IReadOnlyList<DateOnly> dates, Func<int, AuditEntry> audit, CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            var taken = await TakenDatesAsync(tx, tourId, terms.DepartureLocationId, ct);
            var free = dates.Where(date => !taken.Contains(date)).ToList();
            foreach (var date in free)
            {
                await tx.ExecuteAsync("""
                    INSERT INTO tour_departures (tour_id, operating_branch_id, departure_location_id, departure_date,
                        return_date, capacity, min_guests, adult_price, child_price, status)
                    VALUES (@tour, @branch, @location, @date, @return, @capacity, @min, @adult, @child, 'open')
                    """, ct, ("@tour", tourId), ("@branch", terms.OperatingBranchId),
                    ("@location", terms.DepartureLocationId), ("@date", date),
                    ("@return", DepartureRules.ReturnDate(date, durationDays)), ("@capacity", terms.Capacity),
                    ("@min", terms.MinGuests), ("@adult", terms.AdultPrice), ("@child", terms.ChildPrice));
            }
            if (free.Count > 0) await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit(free.Count), ct);
            return (IReadOnlyList<DateOnly>)dates.Where(taken.Contains).ToList();
        }, ct);

    /// <summary>False when the new capacity is below the seats already reserved (checked in the same UPDATE).</summary>
    public Task<bool> UpdateAsync(ulong id, ValidDepartureTerms terms, AuditEntry audit, CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            var rows = await tx.ExecuteAsync("""
                UPDATE tour_departures SET operating_branch_id = @branch, capacity = @capacity, min_guests = @min,
                    adult_price = @adult, child_price = @child
                WHERE id = @id AND reserved_seats <= @capacity
                """, ct, ("@branch", terms.OperatingBranchId), ("@capacity", terms.Capacity),
                ("@min", terms.MinGuests), ("@adult", terms.AdultPrice), ("@child", terms.ChildPrice), ("@id", id));
            if (rows > 0) await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit, ct);
            return rows > 0;
        }, ct);

    /// <summary>Moves the departure only if it is still in <paramref name="from"/>; a reason is kept on cancel.</summary>
    public Task<bool> SetStatusAsync(ulong id, string from, string status, string? reason, AuditEntry audit,
        CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            var rows = await tx.ExecuteAsync("""
                UPDATE tour_departures SET status = @status, cancel_reason = @reason,
                    cancelled_at = IF(@reason IS NULL, NULL, UTC_TIMESTAMP(6))
                WHERE id = @id AND status = @from
                """, ct, ("@status", status), ("@reason", reason), ("@id", id), ("@from", from));
            if (rows > 0) await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit, ct);
            return rows > 0;
        }, ct);

    private static async Task<HashSet<DateOnly>> TakenDatesAsync(Transaction tx, ulong tourId, ulong locationId,
        CancellationToken ct)
    {
        // FOR UPDATE keeps two managers creating the same week from both inserting a date.
        await using var command = tx.Command("SELECT departure_date FROM tour_departures "
            + "WHERE tour_id = @tour AND departure_location_id = @location FOR UPDATE",
            ("@tour", tourId), ("@location", locationId));
        return (await command.ReadAllAsync(r => r.GetDateOnly("departure_date"), ct)).ToHashSet();
    }

    private static string Where(AdminDepartureFilter filter, ScopeSet scope, MySqlCommand command)
    {
        var sql = new StringBuilder(" WHERE 1 = 1");
        ScopeSql.AppendBranchFilter(sql, command, "d.operating_branch_id", scope);
        SqlFilter.AddIfPresent(sql, command, "d.tour_id = @tourId", "@tourId", filter.TourId);
        SqlFilter.AddIfPresent(sql, command, "d.departure_date >= @from", "@from", filter.From);
        SqlFilter.AddIfPresent(sql, command, "d.departure_date <= @to", "@to", filter.To);
        SqlFilter.AddIfPresent(sql, command, "d.status = @status", "@status", filter.Status);
        SqlFilter.AddIfPresent(sql, command, "d.operating_branch_id = @branchId", "@branchId", filter.BranchId);
        return sql.ToString();
    }

    private static AdminDepartureRow Read(MySqlDataReader r) => new(new AdminDepartureDto(r.GetId("id"),
        r.GetId("tour_id"), r.GetString("tour_code"), r.GetString("tour_title"), r.GetId("operating_branch_id"),
        r.GetString("branch_name"), r.GetId("departure_location_id"), r.GetString("departure_from"),
        r.GetDateOnly("departure_date"), r.GetDateOnly("return_date"), r.GetInt32("capacity"),
        r.GetInt32("reserved_seats"), r.GetInt32("min_guests"), r.GetDecimal("adult_price"),
        r.GetNullableDecimal("child_price"), r.GetString("status"), false, r.GetInt32("active_bookings"),
        r.GetNullableString("cancel_reason")), r.GetUInt64("operating_branch_id"));
}
