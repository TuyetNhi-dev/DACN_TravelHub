using System.Text;
using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Tours;

public sealed class TourRepository(MySqlConnectionFactory connections)
{
    private const string SummarySelect = """
        SELECT t.id, t.code, t.title, destination.name AS destination,
            (SELECT GROUP_CONCAT(DISTINCT l.name ORDER BY l.name SEPARATOR ', ')
             FROM tour_departures d JOIN locations l ON l.id = d.departure_location_id
             WHERE d.tour_id = t.id) AS departure_from,
            t.duration_days, t.duration_nights,
            (SELECT GROUP_CONCAT(tt.name ORDER BY tt.name SEPARATOR ', ')
             FROM tour_transport_types link JOIN transport_types tt ON tt.id = link.transport_type_id
             WHERE link.tour_id = t.id) AS transport,
            t.base_price, t.description,
            (SELECT GROUP_CONCAT(d.departure_date ORDER BY d.departure_date SEPARATOR ',')
             FROM tour_departures d
             WHERE d.tour_id = t.id AND d.status = 'open' AND d.departure_date > @today
               AND d.reserved_seats < d.capacity) AS upcoming_dates,
            (SELECT GROUP_CONCAT(DISTINCT r.code ORDER BY r.code SEPARATOR ',')
             FROM tour_departures d
             JOIN branches b ON b.id = d.operating_branch_id
             JOIN regions r ON r.id = b.region_id
             WHERE d.tour_id = t.id AND d.status = 'open' AND d.departure_date > @today) AS departure_regions
        FROM tours t
        JOIN locations destination ON destination.id = t.destination_id
        WHERE t.status = 'published'
        """;

    /// <summary>
    /// Published tours matching <paramref name="search"/>; a null <paramref name="page"/> returns them all.
    /// </summary>
    public async Task<IReadOnlyList<TourSummaryDto>> SearchAsync(DateOnly today, TourSearch search,
        (int Offset, int Limit)? page, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand { Connection = connection };
        var sql = new StringBuilder(SummarySelect);
        TourSearchSql.AppendFilters(sql, command, search);
        sql.Append(TourSearchSql.OrderBy(search));
        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@region", search.Region);
        if (page is { } window)
        {
            sql.Append(" LIMIT @limit OFFSET @offset");
            command.Parameters.AddWithValue("@limit", window.Limit);
            command.Parameters.AddWithValue("@offset", window.Offset);
        }
        command.CommandText = sql.ToString();
        return await command.ReadAllAsync(ReadSummary, ct);
    }

    /// <summary>How many published tours match, for the "total" of a paged answer.</summary>
    public async Task<int> CountAsync(DateOnly today, TourSearch search, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand { Connection = connection };
        var sql = new StringBuilder("""
            SELECT COUNT(*) FROM tours t JOIN locations destination ON destination.id = t.destination_id
            WHERE t.status = 'published'
            """);
        TourSearchSql.AppendFilters(sql, command, search);
        command.Parameters.AddWithValue("@today", today);
        command.CommandText = sql.ToString();
        return Convert.ToInt32(await command.ExecuteScalarAsync(ct));
    }

    /// <summary>Destinations with at least one published tour, for the destination filter of /tours.</summary>
    public async Task<IReadOnlyList<TourDestinationDto>> ListDestinationsAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT l.id, l.name, COUNT(*) AS tour_count
            FROM tours t JOIN locations l ON l.id = t.destination_id
            WHERE t.status = 'published'
            GROUP BY l.id, l.name
            ORDER BY l.name
            """, connection);
        return await command.ReadAllAsync(reader => new TourDestinationDto(
            reader.GetId("id"), reader.GetString("name"), reader.GetInt32("tour_count")), ct);
    }

    /// <summary>Published tours of one collection, in the collection's own order.</summary>
    public async Task<IReadOnlyList<TourSummaryDto>> ListByCollectionAsync(ulong collectionId, DateOnly today,
        CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect + """
             AND EXISTS (SELECT 1 FROM tour_collection_items i WHERE i.tour_id = t.id AND i.collection_id = @collection)
            ORDER BY (SELECT i.sort_order FROM tour_collection_items i
                      WHERE i.tour_id = t.id AND i.collection_id = @collection), t.id
            """, connection);
        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@collection", collectionId);
        return await command.ReadAllAsync(ReadSummary, ct);
    }

    public async Task<TourSummaryDto?> FindPublishedAsync(ulong id, DateOnly today, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect + " AND t.id = @id", connection);
        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@id", id);
        return await command.ReadSingleAsync(ReadSummary, ct);
    }

    public async Task<IReadOnlyList<ItineraryDayDto>> ListItineraryAsync(ulong tourId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT day_number, title, description FROM tour_itinerary_days
            WHERE tour_id = @id ORDER BY day_number
            """, connection);
        command.Parameters.AddWithValue("@id", tourId);
        return await command.ReadAllAsync(reader => new ItineraryDayDto(
            reader.GetInt32("day_number"), reader.GetString("title"), reader.GetNullableString("description")), ct);
    }

    /// <summary>Photos, cover (lowest sort_order) first; id breaks ties so the order never changes between calls.</summary>
    public async Task<IReadOnlyList<TourImageRow>> ListImagesAsync(ulong tourId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT image_url, alt_text, sort_order FROM tour_images
            WHERE tour_id = @id ORDER BY sort_order, id
            """, connection);
        command.Parameters.AddWithValue("@id", tourId);
        return await command.ReadAllAsync(reader => new TourImageRow(
            reader.GetString("image_url"), reader.GetNullableString("alt_text"), reader.GetInt32("sort_order")), ct);
    }

    /// <summary>Inclusion lines in insertion order, which is the order the operator wrote them in.</summary>
    public async Task<IReadOnlyList<TourInclusionRow>> ListInclusionsAsync(ulong tourId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT description, is_included FROM tour_inclusions
            WHERE tour_id = @id ORDER BY id
            """, connection);
        command.Parameters.AddWithValue("@id", tourId);
        return await command.ReadAllAsync(reader => new TourInclusionRow(
            reader.GetString("description"), reader.GetBoolean("is_included")), ct);
    }

    /// <summary>Departures from today on, excluding cancelled ones, which customers never need to see.</summary>
    public async Task<IReadOnlyList<TourDepartureRow>> ListUpcomingDeparturesAsync(
        ulong tourId, DateOnly today, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT d.id, l.name AS departure_from, d.departure_date, d.return_date, d.capacity,
                d.reserved_seats, d.adult_price, d.child_price, d.status
            FROM tour_departures d JOIN locations l ON l.id = d.departure_location_id
            WHERE d.tour_id = @id AND d.departure_date >= @today AND d.status <> 'cancelled'
            ORDER BY d.departure_date, d.id
            """, connection);
        command.Parameters.AddWithValue("@id", tourId);
        command.Parameters.AddWithValue("@today", today);
        return await command.ReadAllAsync(ReadDeparture, ct);
    }

    /// <summary>
    /// Departures of published tours leaving after today and up to <paramref name="until"/>, soonest first. The
    /// filter is the same bookable rule as <see cref="TourService.IsBookable"/>: open, in the future, seats left.
    /// </summary>
    public async Task<IReadOnlyList<UpcomingDepartureRow>> ListDepartingSoonAsync(
        DateOnly today, DateOnly until, int limit, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT d.id AS departure_id, t.id AS tour_id, t.code, t.title, destination.name AS destination,
                origin.name AS departure_from, d.departure_date, t.duration_days, t.duration_nights,
                d.capacity, d.reserved_seats, d.adult_price
            FROM tour_departures d
            JOIN tours t ON t.id = d.tour_id
            JOIN locations destination ON destination.id = t.destination_id
            JOIN locations origin ON origin.id = d.departure_location_id
            WHERE t.status = 'published' AND d.status = 'open'
              AND d.departure_date > @today AND d.departure_date <= @until
              AND d.reserved_seats < d.capacity
            ORDER BY d.departure_date, d.id
            LIMIT @limit
            """, connection);
        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@until", until);
        command.Parameters.AddWithValue("@limit", limit);
        return await command.ReadAllAsync(ReadDepartingSoon, ct);
    }

    private static UpcomingDepartureRow ReadDepartingSoon(MySqlDataReader reader) => new(
        reader.GetId("departure_id"),
        reader.GetId("tour_id"),
        reader.GetString("code"),
        reader.GetString("title"),
        reader.GetString("destination"),
        reader.GetString("departure_from"),
        reader.GetDateOnly("departure_date"),
        reader.GetInt32("duration_days"),
        reader.GetInt32("duration_nights"),
        reader.GetInt32("capacity"),
        reader.GetInt32("reserved_seats"),
        reader.GetDecimal("adult_price"));

    private static TourSummaryDto ReadSummary(MySqlDataReader reader) => new(
        reader.GetId("id"),
        reader.GetString("code"),
        reader.GetString("title"),
        reader.GetString("destination"),
        reader.GetNullableString("departure_from"),
        reader.GetInt32("duration_days"),
        reader.GetInt32("duration_nights"),
        reader.GetNullableString("transport"),
        reader.GetDecimal("base_price"),
        reader.GetNullableString("description"),
        reader.GetDateList("upcoming_dates"),
        SplitCodes(reader.GetNullableString("departure_regions")));

    private static IReadOnlyList<string> SplitCodes(string? value) =>
        string.IsNullOrEmpty(value) ? [] : value.Split(',');

    private static TourDepartureRow ReadDeparture(MySqlDataReader reader) => new(
        reader.GetId("id"),
        reader.GetString("departure_from"),
        reader.GetDateOnly("departure_date"),
        reader.GetDateOnly("return_date"),
        reader.GetInt32("capacity"),
        reader.GetInt32("reserved_seats"),
        reader.GetDecimal("adult_price"),
        reader.GetNullableDecimal("child_price"),
        reader.GetString("status"));
}
