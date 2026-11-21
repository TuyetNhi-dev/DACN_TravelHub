using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Cart;

/// <summary>SQL for cart_items (migration 013). Every statement filters by the session's user id.</summary>
public sealed class CartRepository(MySqlConnectionFactory connections)
{
    private const string DepartureSelect = """
        SELECT d.id AS departure_id, t.id AS tour_id, t.code, t.title, t.status AS tour_status,
            destination.name AS destination, cover.image_url, cover.alt_text, origin.name AS departure_from,
            d.departure_date, d.return_date, d.capacity, d.reserved_seats, d.adult_price, d.child_price, d.status
        FROM tour_departures d
        JOIN tours t ON t.id = d.tour_id
        JOIN locations destination ON destination.id = t.destination_id
        JOIN locations origin ON origin.id = d.departure_location_id
        LEFT JOIN tour_images cover ON cover.id = (
            SELECT i.id FROM tour_images i WHERE i.tour_id = t.id ORDER BY i.sort_order, i.id LIMIT 1)
        """;

    /// <summary>Newest first: the cart page shows the most recent choice on top.</summary>
    public async Task<IReadOnlyList<CartItemRow>> ListItemsAsync(ulong userId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT id, tour_departure_id, adult_count, child_count, adult_price_seen, child_price_seen, updated_at
            FROM cart_items WHERE user_id = @user ORDER BY updated_at DESC, id DESC
            """, connection);
        command.Parameters.AddWithValue("@user", userId);
        return await command.ReadAllAsync(ReadItem, ct);
    }

    /// <summary>Live data for the given departures; ids that no longer exist are simply absent.</summary>
    public async Task<IReadOnlyList<CartDepartureRow>> ListDeparturesAsync(IReadOnlyCollection<ulong> ids,
        CancellationToken ct)
    {
        if (ids.Count == 0) return [];
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand { Connection = connection };
        // One named parameter per id: the values are never spliced into the SQL text.
        var names = new List<string>(ids.Count);
        foreach (var id in ids)
        {
            var name = $"@d{names.Count}";
            command.Parameters.AddWithValue(name, id);
            names.Add(name);
        }
        command.CommandText = DepartureSelect + $" WHERE d.id IN ({string.Join(", ", names)})";
        return await command.ReadAllAsync(ReadDeparture, ct);
    }

    /// <summary>
    /// Adds the departure or, when it is already in the cart, replaces its head count (UNIQUE key). The row alias
    /// (<c>AS new</c>) needs MySQL 8.0.19+; it replaces VALUES(), which MySQL deprecates.
    /// </summary>
    public async Task SaveAsync(ulong userId, IReadOnlyList<CartSave> items, DateTime nowUtc, CancellationToken ct)
    {
        if (items.Count == 0) return;
        await using var connection = await connections.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        foreach (var item in items)
        {
            await using var command = new MySqlCommand("""
                INSERT INTO cart_items (user_id, tour_departure_id, adult_count, child_count, adult_price_seen,
                    child_price_seen, created_at, updated_at)
                VALUES (@user, @departure, @adults, @children, @adultPrice, @childPrice, @now, @now) AS new
                ON DUPLICATE KEY UPDATE adult_count = new.adult_count, child_count = new.child_count,
                    adult_price_seen = new.adult_price_seen, child_price_seen = new.child_price_seen,
                    updated_at = new.updated_at
                """, connection, transaction);
            command.Parameters.AddWithValue("@user", userId);
            command.Parameters.AddWithValue("@departure", item.Choice.DepartureId);
            command.Parameters.AddWithValue("@adults", item.Choice.AdultCount);
            command.Parameters.AddWithValue("@children", item.Choice.ChildCount);
            command.Parameters.AddWithValue("@adultPrice", item.AdultPrice);
            command.Parameters.AddWithValue("@childPrice", item.ChildPrice);
            command.Parameters.AddWithValue("@now", item.UpdatedAt ?? nowUtc);
            await command.ExecuteNonQueryAsync(ct);
        }
        await transaction.CommitAsync(ct);
    }

    /// <summary>False when the item does not exist or belongs to someone else (same answer, no hint which).</summary>
    public async Task<bool> DeleteAsync(ulong userId, ulong itemId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(
            "DELETE FROM cart_items WHERE id = @id AND user_id = @user", connection);
        command.Parameters.AddWithValue("@id", itemId);
        command.Parameters.AddWithValue("@user", userId);
        return await command.ExecuteNonQueryAsync(ct) > 0;
    }

    private static CartItemRow ReadItem(MySqlDataReader reader) => new(
        reader.GetId("id"),
        reader.GetUInt64("tour_departure_id"),
        reader.GetInt32("adult_count"),
        reader.GetInt32("child_count"),
        reader.GetDecimal("adult_price_seen"),
        reader.GetNullableDecimal("child_price_seen"),
        reader.GetUtcDateTime("updated_at"));

    private static CartDepartureRow ReadDeparture(MySqlDataReader reader) => new(
        reader.GetId("departure_id"),
        reader.GetId("tour_id"),
        reader.GetString("code"),
        reader.GetString("title"),
        reader.GetString("tour_status"),
        reader.GetString("destination"),
        reader.GetNullableString("image_url"),
        reader.GetNullableString("alt_text"),
        reader.GetString("departure_from"),
        reader.GetDateOnly("departure_date"),
        reader.GetDateOnly("return_date"),
        reader.GetInt32("capacity"),
        reader.GetInt32("reserved_seats"),
        reader.GetDecimal("adult_price"),
        reader.GetNullableDecimal("child_price"),
        reader.GetString("status"));
}
