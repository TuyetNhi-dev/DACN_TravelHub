using System.Text;
using MySqlConnector;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin.Access;

namespace TravelHub.Api.Features.Admin.Tours;

public sealed record AdminTourRow(AdminTourSummaryDto Summary, ulong BranchId);

/// <summary>Reads of the tour editor. Writes live in <see cref="AdminTourWriter"/>.</summary>
public sealed class AdminTourRepository(MySqlConnectionFactory connections)
{
    private const string SummarySelect = """
        SELECT t.id, t.code, t.title, l.name AS destination, t.operating_branch_id, b.name AS branch_name, t.status,
            t.duration_days, t.duration_nights, t.base_price,
            (SELECT COUNT(*) FROM tour_departures d WHERE d.tour_id = t.id AND d.status = 'open'
                AND d.departure_date > @today) AS upcoming,
            (SELECT COUNT(*) FROM tour_images i WHERE i.tour_id = t.id) AS image_count,
            (SELECT i.image_url FROM tour_images i WHERE i.tour_id = t.id ORDER BY i.sort_order, i.id LIMIT 1)
                AS thumbnail_url,
            c.name AS category_name
        FROM tours t
        JOIN locations l ON l.id = t.destination_id
        JOIN branches b ON b.id = t.operating_branch_id
        LEFT JOIN tour_categories c ON c.id = t.category_id
        """;

    public async Task<(IReadOnlyList<AdminTourRow> Rows, int Total)> ListAsync(AdminTourFilter filter, ScopeSet scope,
        DateOnly today, int offset, int limit, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var count = new MySqlCommand { Connection = connection };
        count.CommandText = "SELECT COUNT(*) FROM tours t" + Where(filter, scope, count);
        var total = Convert.ToInt32(await count.ExecuteScalarAsync(ct));
        await using var command = new MySqlCommand { Connection = connection };
        command.CommandText = SummarySelect + Where(filter, scope, command)
            + " ORDER BY " + AdminTourSort.Sql(filter.Sort) + " LIMIT @limit OFFSET @offset";
        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@limit", limit);
        command.Parameters.AddWithValue("@offset", offset);
        return (await command.ReadAllAsync(ReadSummary, ct), total);
    }

    public async Task<AdminTourRow?> FindSummaryAsync(ulong id, DateOnly today, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect + " WHERE t.id = @id", connection);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@today", today);
        return await command.ReadSingleAsync(ReadSummary, ct);
    }

    public async Task<AdminTourDetailDto?> FindDetailAsync(ulong id, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT id, code, title, destination_id, category_id, operating_branch_id, duration_days, duration_nights,
                base_price, description, status, cancellation_policy, travel_notes
            FROM tours WHERE id = @id
            """, connection);
        command.Parameters.AddWithValue("@id", id);
        var tour = await command.ReadSingleAsync(r => new AdminTourDetailDto(r.GetId("id"), r.GetString("code"),
            r.GetString("title"), r.GetId("destination_id"), r.GetNullableId("category_id"),
            r.GetId("operating_branch_id"), r.GetInt32("duration_days"), r.GetInt32("duration_nights"),
            r.GetDecimal("base_price"), r.GetNullableString("description"), r.GetString("status"), [], [], [],
            false, r.GetNullableString("cancellation_policy"), r.GetNullableString("travel_notes")), ct);
        if (tour is null) return null;
        return tour with
        {
            Images = await ReadListAsync(connection, id, "SELECT image_url, alt_text FROM tour_images "
                + "WHERE tour_id = @id ORDER BY sort_order, id",
                r => new AdminTourImageDto(r.GetString("image_url"), r.GetNullableString("alt_text")), ct),
            Itinerary = await ReadListAsync(connection, id, "SELECT day_number, title, description "
                + "FROM tour_itinerary_days WHERE tour_id = @id ORDER BY day_number",
                r => new AdminItineraryDayDto(r.GetInt32("day_number"), r.GetString("title"),
                    r.GetNullableString("description")), ct),
            Inclusions = await ReadListAsync(connection, id, "SELECT service_type, description, is_included "
                + "FROM tour_inclusions WHERE tour_id = @id ORDER BY is_included DESC, id",
                r => new AdminInclusionDto(r.GetString("service_type"), r.GetString("description"),
                    r.GetBoolean("is_included")), ct),
        };
    }

    public async Task<bool> CodeExistsAsync(string code, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("SELECT COUNT(*) FROM tours WHERE code = @code", connection);
        command.Parameters.AddWithValue("@code", code);
        return Convert.ToInt32(await command.ExecuteScalarAsync(ct)) > 0;
    }

    private static async Task<IReadOnlyList<T>> ReadListAsync<T>(MySqlConnection connection, ulong id, string sql,
        Func<MySqlDataReader, T> read, CancellationToken ct)
    {
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", id);
        return await command.ReadAllAsync(read, ct);
    }

    private static string Where(AdminTourFilter filter, ScopeSet scope, MySqlCommand command)
    {
        var sql = new StringBuilder(" WHERE 1 = 1");
        ScopeSql.AppendBranchFilter(sql, command, "t.operating_branch_id", scope);
        if (filter.Status is not null)
        {
            sql.Append(" AND t.status = @status");
            command.Parameters.AddWithValue("@status", filter.Status);
        }
        if (filter.Query is not null)
        {
            sql.Append(" AND (t.code = @code OR t.title LIKE @like)");
            command.Parameters.AddWithValue("@code", filter.Query.ToUpperInvariant());
            command.Parameters.AddWithValue("@like", SqlText.Contains(filter.Query));
        }
        SqlFilter.AddIfPresent(sql, command, "t.operating_branch_id = @branchId", "@branchId", filter.BranchId);
        SqlFilter.AddIfPresent(sql, command, "t.category_id = @categoryId", "@categoryId", filter.CategoryId);
        SqlFilter.AddIfPresent(sql, command,
            "t.operating_branch_id IN (SELECT id FROM branches WHERE region_id = @regionId)", "@regionId",
            filter.RegionId);
        return sql.ToString();
    }

    private static AdminTourRow ReadSummary(MySqlDataReader r) => new(new AdminTourSummaryDto(r.GetId("id"),
        r.GetString("code"), r.GetString("title"), r.GetString("destination"), r.GetId("operating_branch_id"),
        r.GetString("branch_name"), r.GetString("status"), r.GetInt32("duration_days"),
        r.GetInt32("duration_nights"), r.GetDecimal("base_price"), r.GetInt32("upcoming"),
        r.GetInt32("image_count"), false, r.GetNullableString("category_name"), r.GetNullableString("thumbnail_url")),
        r.GetUInt64("operating_branch_id"));
}
