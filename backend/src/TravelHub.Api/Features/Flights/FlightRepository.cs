using System.Text;
using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Flights;

public sealed class FlightRepository(MySqlConnectionFactory connections)
{
    private const int MaxResults = 200;
    private const int MaxDeals = 60;

    // Only quotes that are active, in VND, unexpired and for flights that have not departed are sellable;
    // a deal (quote with a seat allotment) also needs at least one seat left.
    private const string SellableQuote = """
        o.status = 'active' AND o.currency = 'VND'
          AND (o.expires_at IS NULL OR o.expires_at > @now) AND f.depart_at > @now
          AND (o.allotment_seats IS NULL OR o.sold_seats < o.allotment_seats)
        """;

    // Vietnam has used UTC+7 without daylight saving since 1975, so a fixed offset gives the local day.
    private const string LowestByDaySelect = $"""
        SELECT DATE(f.depart_at + INTERVAL 7 HOUR) AS vietnam_day, MIN(o.quoted_price) AS lowest_price,
            COUNT(*) AS offer_count
        FROM flight_offers o
        JOIN flights f ON f.id = o.flight_id
        JOIN locations origin ON origin.id = f.origin_location_id
        JOIN locations destination ON destination.id = f.destination_location_id
        WHERE {SellableQuote}
          AND origin.code = @from AND destination.code = @to AND o.cabin_class = @cabin
          AND f.depart_at >= @rangeStart AND f.depart_at < @rangeEnd
        GROUP BY vietnam_day
        ORDER BY vietnam_day
        """;

    // Deals only (quotes with seats left in SàiHành's allotment). One row per route: a staff-featured deal
    // first, else the lowest; ties go to the earlier flight.
    private const string DealsSelect = $"""
        SELECT * FROM (
            SELECT o.id AS offer_id, f.id AS flight_id, origin.code AS origin_code,
                COALESCE(origin_city.name, origin.name) AS origin_city, destination.code AS destination_code,
                COALESCE(destination_city.name, destination.name) AS destination_city, f.depart_at,
                a.name AS airline, a.iata_code, f.flight_number, o.cabin_class, o.quoted_price, o.is_featured,
                o.updated_at, o.allotment_seats - o.sold_seats AS remaining_seats,
                ROW_NUMBER() OVER (PARTITION BY f.origin_location_id, f.destination_location_id
                    ORDER BY o.is_featured DESC, o.quoted_price, f.depart_at, o.id) AS route_rank
            FROM flight_offers o
            JOIN flights f ON f.id = o.flight_id
            JOIN airlines a ON a.id = f.airline_id
            JOIN locations origin ON origin.id = f.origin_location_id
            LEFT JOIN locations origin_city ON origin_city.id = origin.parent_id
            JOIN locations destination ON destination.id = f.destination_location_id
            LEFT JOIN locations destination_city ON destination_city.id = destination.parent_id
            WHERE {SellableQuote}
              AND o.allotment_seats IS NOT NULL AND o.cabin_class = @cabin AND f.depart_at < @windowEnd
              AND (@from IS NULL OR origin.code = @from)
        ) ranked
        WHERE route_rank = 1
        ORDER BY is_featured DESC, quoted_price, depart_at
        LIMIT @limit
        """;

    private const string OfferSelect = $"""
        SELECT f.id AS flight_id, o.id AS offer_id, f.flight_number, a.name AS airline, a.iata_code,
            origin.code AS origin_code, COALESCE(origin_city.name, origin.name) AS origin_city,
            destination.code AS destination_code, COALESCE(destination_city.name, destination.name) AS destination_city,
            f.depart_at, f.arrive_at, TIMESTAMPDIFF(MINUTE, f.depart_at, f.arrive_at) AS duration_minutes,
            o.cabin_class, o.quoted_price, o.baggage_terms, o.change_cancel_terms, o.expires_at,
            o.allotment_seats - o.sold_seats AS remaining_seats
        FROM flight_offers o
        JOIN flights f ON f.id = o.flight_id
        JOIN airlines a ON a.id = f.airline_id
        JOIN locations origin ON origin.id = f.origin_location_id
        LEFT JOIN locations origin_city ON origin_city.id = origin.parent_id
        JOIN locations destination ON destination.id = f.destination_location_id
        LEFT JOIN locations destination_city ON destination_city.id = destination.parent_id
        WHERE {SellableQuote}
        """;

    public async Task<IReadOnlyList<FlightOfferDto>> SearchAsync(FlightSearchQuery query, DateTime nowUtc,
        DateTime? dayStartUtc, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand { Connection = connection };
        var sql = new StringBuilder(OfferSelect);
        command.Parameters.AddWithValue("@now", nowUtc);
        AppendFilter(sql, command, "origin.code", "@from", query.From);
        AppendFilter(sql, command, "destination.code", "@to", query.To);
        AppendFilter(sql, command, "o.cabin_class", "@cabin", query.Cabin);
        if (dayStartUtc is { } start)
        {
            sql.Append(" AND f.depart_at >= @dayStart AND f.depart_at < @dayEnd");
            command.Parameters.AddWithValue("@dayStart", start);
            command.Parameters.AddWithValue("@dayEnd", start.AddDays(1));
        }
        sql.Append(" ORDER BY f.depart_at, o.quoted_price, o.id LIMIT ").Append(MaxResults);
        command.CommandText = sql.ToString();
        return await command.ReadAllAsync(ReadOffer, ct);
    }

    /// <summary>Lowest sellable quote per Vietnamese departure day in [rangeStartUtc, rangeEndUtc).</summary>
    public async Task<IReadOnlyList<FlightDayLowest>> LowestPricesByDayAsync(FlightRoute route,
        DateTime rangeStartUtc, DateTime rangeEndUtc, DateTime nowUtc, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(LowestByDaySelect, connection);
        command.Parameters.AddWithValue("@now", nowUtc);
        command.Parameters.AddWithValue("@from", route.From);
        command.Parameters.AddWithValue("@to", route.To);
        command.Parameters.AddWithValue("@cabin", route.Cabin);
        command.Parameters.AddWithValue("@rangeStart", rangeStartUtc);
        command.Parameters.AddWithValue("@rangeEnd", rangeEndUtc);
        return await command.ReadAllAsync(reader => new FlightDayLowest(reader.GetDateOnly("vietnam_day"),
            reader.GetDecimal("lowest_price"), reader.GetInt32("offer_count")), ct);
    }

    public async Task<IReadOnlyList<FlightDealDto>> ListDealsAsync(string? from, DateTime nowUtc,
        DateTime windowEndUtc, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(DealsSelect, connection);
        command.Parameters.AddWithValue("@now", nowUtc);
        command.Parameters.AddWithValue("@windowEnd", windowEndUtc);
        command.Parameters.AddWithValue("@cabin", CabinClass.Economy);
        command.Parameters.AddWithValue("@from", (object?)from ?? DBNull.Value);
        command.Parameters.AddWithValue("@limit", MaxDeals);
        return await command.ReadAllAsync(ReadDeal, ct);
    }

    private static FlightDealDto ReadDeal(MySqlDataReader reader) => new(
        reader.GetId("offer_id"),
        reader.GetId("flight_id"),
        reader.GetString("origin_code"),
        reader.GetString("origin_city"),
        reader.GetString("destination_code"),
        reader.GetString("destination_city"),
        reader.GetUtcDateTime("depart_at"),
        reader.GetString("airline"),
        reader.GetNullableString("iata_code"),
        reader.GetString("flight_number"),
        reader.GetString("cabin_class"),
        reader.GetDecimal("quoted_price"),
        reader.GetBoolean("is_featured"),
        reader.GetUtcDateTime("updated_at"),
        reader.GetInt32("remaining_seats"));

    // Column names are compile-time constants; only the values come from the request, as parameters.
    private static void AppendFilter(StringBuilder sql, MySqlCommand command, string column, string name, string? value)
    {
        if (string.IsNullOrEmpty(value)) return;
        sql.Append(" AND ").Append(column).Append(" = ").Append(name);
        command.Parameters.AddWithValue(name, value);
    }

    private static FlightOfferDto ReadOffer(MySqlDataReader reader) => new(
        reader.GetId("flight_id"),
        reader.GetId("offer_id"),
        reader.GetString("flight_number"),
        reader.GetString("airline"),
        reader.GetNullableString("iata_code"),
        reader.GetString("origin_code"),
        reader.GetString("origin_city"),
        reader.GetString("destination_code"),
        reader.GetString("destination_city"),
        reader.GetUtcDateTime("depart_at"),
        reader.GetUtcDateTime("arrive_at"),
        reader.GetInt32("duration_minutes"),
        reader.GetString("cabin_class"),
        reader.GetDecimal("quoted_price"),
        reader.GetNullableString("baggage_terms"),
        reader.GetNullableString("change_cancel_terms"),
        reader.GetNullableUtcDateTime("expires_at"),
        reader.GetNullableInt("remaining_seats"));
}
