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
               AND d.reserved_seats < d.capacity) AS upcoming_dates
        FROM tours t
        JOIN locations destination ON destination.id = t.destination_id
        WHERE t.status = 'published'
        """;

    public async Task<IReadOnlyList<TourSummaryDto>> ListPublishedAsync(DateOnly today, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect + " ORDER BY t.id", connection);
        command.Parameters.AddWithValue("@today", today);
        return await command.ReadAllAsync(ReadSummary, ct);
    }

    public async Task<int> CountPublishedAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("SELECT COUNT(*) FROM tours WHERE status = 'published'", connection);
        return Convert.ToInt32(await command.ExecuteScalarAsync(ct));
    }

    public async Task<IReadOnlyList<TourSummaryDto>> ListPublishedPagedAsync(
        DateOnly today, int offset, int limit, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect + " ORDER BY t.id LIMIT @limit OFFSET @offset", connection);
        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@limit", limit);
        command.Parameters.AddWithValue("@offset", offset);
        return await command.ReadAllAsync(ReadSummary, ct);
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
        reader.GetDateList("upcoming_dates"));

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
