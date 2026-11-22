using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Admin.Departures;

public sealed record ManifestPassengerDto(string FullName, string Type, DateOnly? BirthDate);

public sealed record ManifestBookingDto(string BookingId, string Code, string Status, string ContactName,
    string? ContactPhone, string ContactEmail, int Adults, int Children,
    IReadOnlyList<ManifestPassengerDto> Passengers);

public sealed record ManifestDto(AdminDepartureDto Departure, IReadOnlyList<ManifestBookingDto> Bookings,
    int TotalGuests);

/// <summary>Group list of one departure: every order still holding seats, with its passengers.</summary>
public sealed class ManifestRepository(MySqlConnectionFactory connections)
{
    public async Task<IReadOnlyList<ManifestBookingDto>> ListBookingsAsync(ulong departureId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        var passengers = await ListPassengersAsync(connection, departureId, ct);
        await using var command = new MySqlCommand("""
            SELECT b.id, b.booking_code, i.id AS item_id, i.status, u.full_name, u.phone, u.email,
                td.adult_count, td.child_count
            FROM tour_booking_details td
            JOIN booking_items i ON i.id = td.booking_item_id
            JOIN bookings b ON b.id = i.booking_id
            JOIN users u ON u.id = b.customer_id
            WHERE td.tour_departure_id = @id AND i.status NOT IN ('cancelled', 'failed')
            ORDER BY b.created_at, b.id
            """, connection);
        command.Parameters.AddWithValue("@id", departureId);
        return await command.ReadAllAsync(r => new ManifestBookingDto(r.GetId("id"), r.GetString("booking_code"),
            r.GetString("status"), r.GetString("full_name"), r.GetNullableString("phone"), r.GetString("email"),
            r.GetInt32("adult_count"), r.GetInt32("child_count"),
            passengers.TryGetValue(r.GetUInt64("item_id"), out var list) ? list : []), ct);
    }

    private static async Task<Dictionary<ulong, List<ManifestPassengerDto>>> ListPassengersAsync(
        MySqlConnection connection, ulong departureId, CancellationToken ct)
    {
        await using var command = new MySqlCommand("""
            SELECT p.booking_item_id, p.full_name, p.passenger_type, p.birth_date
            FROM booking_passengers p JOIN tour_booking_details td ON td.booking_item_id = p.booking_item_id
            WHERE td.tour_departure_id = @id
            ORDER BY p.id
            """, connection);
        command.Parameters.AddWithValue("@id", departureId);
        var rows = await command.ReadAllAsync(r => (Item: r.GetUInt64("booking_item_id"),
            Passenger: new ManifestPassengerDto(r.GetString("full_name"), r.GetString("passenger_type"),
                r.GetNullableDateOnly("birth_date"))), ct);
        return rows.GroupBy(row => row.Item).ToDictionary(g => g.Key, g => g.Select(row => row.Passenger).ToList());
    }
}
