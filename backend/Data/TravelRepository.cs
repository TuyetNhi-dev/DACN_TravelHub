using MySqlConnector;
using TravelHub.Api.Models;

namespace TravelHub.Api.Data;

/// <summary>Read-only queries for saihanh_db, preserving the existing API field names.</summary>
public sealed class TravelRepository(MySqlConnectionFactory connections)
{
    private const string TourQuery = """
        SELECT CAST(t.id AS CHAR), t.title,
            (SELECT GROUP_CONCAT(DISTINCT l.name ORDER BY l.name SEPARATOR ', ')
             FROM tour_departures d JOIN locations l ON l.id = d.departure_location_id WHERE d.tour_id = t.id),
            destination.name, t.duration_days, t.duration_nights,
            (SELECT GROUP_CONCAT(tt.name ORDER BY tt.name SEPARATOR ', ')
             FROM tour_transport_types link JOIN transport_types tt ON tt.id = link.transport_type_id WHERE link.tour_id = t.id),
            t.base_price, NULL, NULL, t.description, NULL, NULL
        FROM tours t
        LEFT JOIN locations destination ON destination.id = t.destination_id
        """;

    private static Tour ReadTour(MySqlDataReader reader) => new(
        reader.GetString(0),
        reader.IsDBNull(1) ? null : reader.GetString(1),
        reader.IsDBNull(2) ? null : reader.GetString(2),
        reader.IsDBNull(3) ? null : reader.GetString(3),
        reader.IsDBNull(4) ? null : reader.GetInt32(4),
        reader.IsDBNull(5) ? null : reader.GetInt32(5),
        reader.IsDBNull(6) ? null : reader.GetString(6),
        reader.IsDBNull(7) ? null : reader.GetDecimal(7),
        reader.IsDBNull(8) ? null : reader.GetDecimal(8),
        reader.IsDBNull(9) ? null : reader.GetString(9),
        reader.IsDBNull(10) ? null : reader.GetString(10),
        reader.IsDBNull(11) ? null : reader.GetString(11),
        reader.IsDBNull(12) ? null : reader.GetString(12));

    private const string TourDepartureQuery = """
        SELECT CAST(id AS CHAR), CAST(tour_id AS CHAR), departure_date,
            CAST(capacity AS SIGNED) - CAST(reserved_seats AS SIGNED), adult_price, status
        FROM tour_departures
        """;

    private static TourDeparture ReadTourDeparture(MySqlDataReader reader) => new(
        reader.GetString(0),
        reader.GetString(1),
        reader.IsDBNull(2) ? null : DateOnly.FromDateTime(reader.GetDateTime(2)),
        reader.IsDBNull(3) ? null : reader.GetInt32(3),
        reader.IsDBNull(4) ? null : reader.GetDecimal(4),
        reader.IsDBNull(5) ? null : reader.GetString(5));

    private const string HotelQuery = """
        SELECT CAST(h.id AS CHAR), h.name, l.name, h.address, h.star_rating,
            (SELECT MIN(o.nightly_price) FROM room_types r JOIN hotel_offers o ON o.room_type_id = r.id
             WHERE r.hotel_id = h.id AND o.status = 'active' AND o.currency = 'VND'
               AND o.valid_from <= CURRENT_DATE() AND o.valid_to >= CURRENT_DATE()),
            NULL, h.description, NULL
        FROM hotels h LEFT JOIN locations l ON l.id = h.location_id
        """;

    private static Hotel ReadHotel(MySqlDataReader reader) => new(
        reader.GetString(0),
        reader.IsDBNull(1) ? null : reader.GetString(1),
        reader.IsDBNull(2) ? null : reader.GetString(2),
        reader.IsDBNull(3) ? null : reader.GetString(3),
        reader.IsDBNull(4) ? null : reader.GetInt32(4),
        reader.IsDBNull(5) ? null : reader.GetDecimal(5),
        reader.IsDBNull(6) ? null : reader.GetString(6),
        reader.IsDBNull(7) ? null : reader.GetString(7),
        reader.IsDBNull(8) ? null : reader.GetString(8));

    private const string RoomQuery = """
        SELECT CAST(r.id AS CHAR), CAST(r.hotel_id AS CHAR), r.name, r.max_guests,
            (SELECT MIN(o.nightly_price) FROM hotel_offers o
             WHERE o.room_type_id = r.id AND o.status = 'active' AND o.currency = 'VND'
               AND o.valid_from <= CURRENT_DATE() AND o.valid_to >= CURRENT_DATE()),
            NULL, NULL
        FROM room_types r
        """;

    private static Room ReadRoom(MySqlDataReader reader) => new(
        reader.GetString(0),
        reader.GetString(1),
        reader.IsDBNull(2) ? null : reader.GetString(2),
        reader.IsDBNull(3) ? null : reader.GetInt32(3),
        reader.IsDBNull(4) ? null : reader.GetDecimal(4),
        reader.IsDBNull(5) ? null : reader.GetInt32(5),
        reader.IsDBNull(6) ? null : reader.GetString(6));

    private const string FlightQuery = """
        SELECT CAST(f.id AS CHAR), f.flight_number, a.name, origin.code, origin.name,
            destination.code, destination.name, DATE(f.depart_at), TIME(f.depart_at), TIME(f.arrive_at),
            TIMESTAMPDIFF(MINUTE, f.depart_at, f.arrive_at), o.cabin_class, o.quoted_price, NULL, NULL, NULL
        FROM flights f
        LEFT JOIN airlines a ON a.id = f.airline_id
        LEFT JOIN locations origin ON origin.id = f.origin_location_id
        LEFT JOIN locations destination ON destination.id = f.destination_location_id
        LEFT JOIN flight_offers o ON o.id = (
            SELECT offer.id FROM flight_offers offer
            WHERE offer.flight_id = f.id AND offer.status = 'active' AND offer.currency = 'VND'
                AND offer.expires_at > UTC_TIMESTAMP(6)
            ORDER BY offer.quoted_price, offer.id LIMIT 1)
        """;

    private static Flight ReadFlight(MySqlDataReader reader) => new(
        reader.GetString(0),
        reader.IsDBNull(1) ? null : reader.GetString(1),
        reader.IsDBNull(2) ? null : reader.GetString(2),
        reader.IsDBNull(3) ? null : reader.GetString(3),
        reader.IsDBNull(4) ? null : reader.GetString(4),
        reader.IsDBNull(5) ? null : reader.GetString(5),
        reader.IsDBNull(6) ? null : reader.GetString(6),
        reader.IsDBNull(7) ? null : DateOnly.FromDateTime(reader.GetDateTime(7)),
        reader.IsDBNull(8) ? null : reader.GetTimeSpan(8),
        reader.IsDBNull(9) ? null : reader.GetTimeSpan(9),
        reader.IsDBNull(10) ? null : reader.GetInt32(10),
        reader.IsDBNull(11) ? null : reader.GetString(11),
        reader.IsDBNull(12) ? null : reader.GetDecimal(12),
        reader.IsDBNull(13) ? null : reader.GetInt32(13),
        reader.IsDBNull(14) ? null : reader.GetString(14),
        reader.IsDBNull(15) ? null : reader.GetString(15));

    private static async Task<List<T>> QueryAsync<T>(
        MySqlConnection connection, string sql, Func<MySqlDataReader, T> map,
        CancellationToken cancellationToken, string? id = null)
    {
        await using var command = new MySqlCommand(sql, connection);
        if (id is not null)
            command.Parameters.Add("@id", MySqlDbType.UInt64).Value = ulong.Parse(id);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var rows = new List<T>();
        while (await reader.ReadAsync(cancellationToken))
            rows.Add(map(reader));
        return rows;
    }

    public async Task<IReadOnlyList<Tour>> GetToursAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        return await QueryAsync(connection,
            TourQuery + " ORDER BY t.id", ReadTour, ct);
    }

    public async Task<TourDetail?> GetTourAsync(string id, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        var tours = await QueryAsync(connection,
            TourQuery + " WHERE t.id = @id LIMIT 1", ReadTour, ct, id);
        if (tours.Count == 0) return null;
        var departures = await QueryAsync(connection,
            TourDepartureQuery + " WHERE tour_id = @id ORDER BY departure_date, id",
            ReadTourDeparture, ct, id);
        return new(tours[0], departures);
    }

    public async Task<IReadOnlyList<Hotel>> GetHotelsAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        return await QueryAsync(connection,
            HotelQuery + " ORDER BY h.id", ReadHotel, ct);
    }

    public async Task<HotelDetail?> GetHotelAsync(string id, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        var hotels = await QueryAsync(connection,
            HotelQuery + " WHERE h.id = @id LIMIT 1", ReadHotel, ct, id);
        if (hotels.Count == 0) return null;
        var rooms = await QueryAsync(connection,
            RoomQuery + " WHERE r.hotel_id = @id ORDER BY r.id", ReadRoom, ct, id);
        return new(hotels[0], rooms);
    }

    public async Task<IReadOnlyList<Flight>> GetFlightsAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        return await QueryAsync(connection,
            FlightQuery + " ORDER BY f.depart_at, f.id", ReadFlight, ct);
    }

    public async Task<string?> CheckDatabaseAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("SELECT 1", connection);
        if (Convert.ToInt32(await command.ExecuteScalarAsync(ct)) != 1)
            return null;
        command.CommandText = "SELECT DATABASE()";
        return await command.ExecuteScalarAsync(ct) as string;
    }
}
