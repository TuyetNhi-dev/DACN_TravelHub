using System.Text;
using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Flights;

public sealed class FlightRepository(MySqlConnectionFactory connections)
{
    private const int MaxResults = 200;

    // Only quotes that are active, in VND, unexpired and for flights that have not departed are sellable.
    private const string OfferSelect = """
        SELECT f.id AS flight_id, o.id AS offer_id, f.flight_number, a.name AS airline, a.iata_code,
            origin.code AS origin_code, COALESCE(origin_city.name, origin.name) AS origin_city,
            destination.code AS destination_code, COALESCE(destination_city.name, destination.name) AS destination_city,
            f.depart_at, f.arrive_at, TIMESTAMPDIFF(MINUTE, f.depart_at, f.arrive_at) AS duration_minutes,
            o.cabin_class, o.quoted_price, o.baggage_terms, o.change_cancel_terms, o.expires_at
        FROM flight_offers o
        JOIN flights f ON f.id = o.flight_id
        JOIN airlines a ON a.id = f.airline_id
        JOIN locations origin ON origin.id = f.origin_location_id
        LEFT JOIN locations origin_city ON origin_city.id = origin.parent_id
        JOIN locations destination ON destination.id = f.destination_location_id
        LEFT JOIN locations destination_city ON destination_city.id = destination.parent_id
        WHERE o.status = 'active' AND o.currency = 'VND'
          AND (o.expires_at IS NULL OR o.expires_at > @now) AND f.depart_at > @now
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
        reader.GetNullableUtcDateTime("expires_at"));
}
