using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Hotels;

public sealed class HotelRepository(MySqlConnectionFactory connections)
{
    // Reference price = cheapest active VND offer whose validity window contains today (Vietnam date).
    private const string SummarySelect = """
        SELECT h.id, h.name, l.name AS city, h.address, h.star_rating, h.description,
            (SELECT MIN(o.nightly_price) FROM room_types r JOIN hotel_offers o ON o.room_type_id = r.id
             WHERE r.hotel_id = h.id AND o.status = 'active' AND o.currency = 'VND'
               AND o.valid_from <= @today AND o.valid_to >= @today) AS reference_price
        FROM hotels h JOIN locations l ON l.id = h.location_id
        WHERE h.status = 'active'
        """;

    public async Task<IReadOnlyList<HotelSummaryDto>> ListActiveAsync(DateOnly today, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect + " ORDER BY h.id", connection);
        command.Parameters.AddWithValue("@today", today);
        return await command.ReadAllAsync(ReadSummary, ct);
    }

    public async Task<int> CountActiveAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("SELECT COUNT(*) FROM hotels WHERE status = 'active'", connection);
        return Convert.ToInt32(await command.ExecuteScalarAsync(ct));
    }

    public async Task<IReadOnlyList<HotelSummaryDto>> ListActivePagedAsync(
        DateOnly today, int offset, int limit, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect + " ORDER BY h.id LIMIT @limit OFFSET @offset", connection);
        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@limit", limit);
        command.Parameters.AddWithValue("@offset", offset);
        return await command.ReadAllAsync(ReadSummary, ct);
    }

    public async Task<HotelSummaryDto?> FindActiveAsync(ulong id, DateOnly today, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect + " AND h.id = @id", connection);
        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@id", id);
        return await command.ReadSingleAsync(ReadSummary, ct);
    }

    public async Task<IReadOnlyList<RoomTypeDto>> ListRoomTypesAsync(ulong hotelId, DateOnly today, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT r.id, r.name, r.max_guests, r.description, o.nightly_price, o.terms
            FROM room_types r
            LEFT JOIN hotel_offers o ON o.id = (
                SELECT offer.id FROM hotel_offers offer
                WHERE offer.room_type_id = r.id AND offer.status = 'active' AND offer.currency = 'VND'
                  AND offer.valid_from <= @today AND offer.valid_to >= @today
                ORDER BY offer.nightly_price, offer.id LIMIT 1)
            WHERE r.hotel_id = @id
            ORDER BY o.nightly_price IS NULL, o.nightly_price, r.id
            """, connection);
        command.Parameters.AddWithValue("@id", hotelId);
        command.Parameters.AddWithValue("@today", today);
        return await command.ReadAllAsync(reader => new RoomTypeDto(
            reader.GetId("id"),
            reader.GetString("name"),
            reader.GetInt32("max_guests"),
            reader.GetNullableString("description"),
            reader.GetNullableDecimal("nightly_price"),
            reader.GetNullableString("terms")), ct);
    }

    public async Task<IReadOnlyList<HotelAmenityDto>> ListAmenitiesAsync(ulong hotelId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT a.code, a.name, a.category, a.is_highlight, ha.is_paid
            FROM hotel_amenities ha JOIN amenities a ON a.id = ha.amenity_id
            WHERE ha.hotel_id = @id
            ORDER BY a.sort_order, a.id
            """, connection);
        command.Parameters.AddWithValue("@id", hotelId);
        return await command.ReadAllAsync(reader => new HotelAmenityDto(
            reader.GetString("code"),
            reader.GetString("name"),
            reader.GetString("category"),
            reader.GetBoolean("is_highlight"),
            reader.GetBoolean("is_paid")), ct);
    }

    public async Task<HotelHouseRulesDto> FindHouseRulesAsync(ulong hotelId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var times = new MySqlCommand(
            "SELECT check_in_from, check_out_until FROM hotels WHERE id = @id", connection);
        times.Parameters.AddWithValue("@id", hotelId);
        var (checkIn, checkOut) = await times.ReadSingleAsync(reader => new StayTimes(
            reader.GetNullableClock("check_in_from"), reader.GetNullableClock("check_out_until")), ct)
            ?? new StayTimes(null, null);
        await using var policies = new MySqlCommand(
            "SELECT policy_type, content FROM hotel_policies WHERE hotel_id = @id ORDER BY FIELD(policy_type, " +
            PolicyOrder + "), policy_type", connection);
        policies.Parameters.AddWithValue("@id", hotelId);
        var rows = await policies.ReadAllAsync(reader =>
            new HotelPolicyDto(reader.GetString("policy_type"), reader.GetString("content")), ct);
        return new HotelHouseRulesDto(checkIn, checkOut, rows);
    }

    // Compile-time constant list: the display order of house rules, most asked-about first.
    private const string PolicyOrder =
        "'cancellation', 'children', 'extra_bed', 'payment', 'deposit', 'pets', 'smoking'";

    private sealed record StayTimes(string? CheckIn, string? CheckOut);

    private static HotelSummaryDto ReadSummary(MySqlDataReader reader) => new(
        reader.GetId("id"),
        reader.GetString("name"),
        reader.GetString("city"),
        reader.GetNullableString("address"),
        reader.GetNullableInt("star_rating"),
        reader.GetNullableString("description"),
        reader.GetNullableDecimal("reference_price"));
}
