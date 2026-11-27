using MySqlConnector;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Tickets;

public sealed class TicketRepository(MySqlConnectionFactory connections)
{
    // A random 60-bit code practically never collides; the retries only keep a collision from becoming an error.
    private const int MaxCodeAttempts = 3;

    /// <summary>The tour item of the order, only when the order belongs to this customer.</summary>
    public async Task<CustomerTourItemRow?> FindCustomerTourItemAsync(ulong customerId, ulong bookingId,
        CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand($"""
            SELECT i.id AS item_id, b.id AS booking_id, b.booking_code, i.status, t.code AS tour_code,
                t.title AS tour_title, l.name AS departure_from, d.departure_date, d.return_date
            FROM bookings b
            JOIN booking_items i ON i.booking_id = b.id AND i.service_type = '{ServiceType.Tour}'
            JOIN tour_booking_details td ON td.booking_item_id = i.id
            JOIN tour_departures d ON d.id = td.tour_departure_id
            JOIN tours t ON t.id = d.tour_id
            JOIN locations l ON l.id = d.departure_location_id
            WHERE b.id = @booking AND b.customer_id = @customer
            """, connection);
        command.Parameters.AddWithValue("@booking", bookingId);
        command.Parameters.AddWithValue("@customer", customerId);
        return await command.ReadSingleAsync(r => new CustomerTourItemRow(r.GetUInt64("item_id"),
            r.GetId("booking_id"), r.GetString("booking_code"), r.GetString("status"), r.GetString("tour_code"),
            r.GetString("tour_title"), r.GetString("departure_from"), r.GetDateOnly("departure_date"),
            r.GetDateOnly("return_date")), ct);
    }

    /// <summary>The item's ticket, created on first use. Safe under concurrent calls: the item key is unique.</summary>
    public async Task<TicketKey> EnsureTicketAsync(ulong itemId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        for (var attempt = 0; attempt < MaxCodeAttempts; attempt++)
        {
            if (await FindKeyAsync(connection, itemId, ct) is { } existing) return existing;
            // INSERT IGNORE: a concurrent first view inserts the same item; the next read then finds that row.
            await using var insert = new MySqlCommand(
                "INSERT IGNORE INTO tour_tickets (booking_item_id, ticket_code) VALUES (@item, @code)", connection);
            insert.Parameters.AddWithValue("@item", itemId);
            insert.Parameters.AddWithValue("@code", TicketToken.NewCode());
            await insert.ExecuteNonQueryAsync(ct);
        }
        return await FindKeyAsync(connection, itemId, ct)
            ?? throw new InvalidOperationException("Could not allocate a unique ticket code.");
    }

    public async Task<IReadOnlyList<TicketPassengerDto>> ListPassengersAsync(ulong itemId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT p.full_name, p.passenger_type, c.passenger_id IS NOT NULL AS checked_in
            FROM booking_passengers p LEFT JOIN passenger_check_ins c ON c.passenger_id = p.id
            WHERE p.booking_item_id = @item ORDER BY p.id
            """, connection);
        command.Parameters.AddWithValue("@item", itemId);
        return await command.ReadAllAsync(r => new TicketPassengerDto(r.GetString("full_name"),
            r.GetString("passenger_type"), r.GetBoolean("checked_in")), ct);
    }

    private static async Task<TicketKey?> FindKeyAsync(MySqlConnection connection, ulong itemId, CancellationToken ct)
    {
        await using var command = new MySqlCommand(
            "SELECT ticket_code, version FROM tour_tickets WHERE booking_item_id = @item", connection);
        command.Parameters.AddWithValue("@item", itemId);
        return await command.ReadSingleAsync(r => new TicketKey(r.GetString("ticket_code"), r.GetInt32("version")),
            ct);
    }
}
