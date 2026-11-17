using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Tours;

public sealed class TourCollectionRepository(MySqlConnectionFactory connections)
{
    private const string CollectionSelect = """
        SELECT c.id, c.slug, c.name, c.tagline, c.season_label, cover.name AS cover_place,
            (SELECT COUNT(*) FROM tour_collection_items i JOIN tours t ON t.id = i.tour_id
             WHERE i.collection_id = c.id AND t.status = 'published') AS tour_count
        FROM tour_collections c
        LEFT JOIN locations cover ON cover.id = c.cover_location_id
        WHERE c.is_active = TRUE
        """;

    public async Task<IReadOnlyList<TourCollectionDto>> ListActiveAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(CollectionSelect + " ORDER BY c.sort_order, c.id", connection);
        var rows = await command.ReadAllAsync(ReadRow, ct);
        return rows.Select(row => row.Collection).ToList();
    }

    public async Task<TourCollectionRow?> FindActiveAsync(string slug, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(CollectionSelect + " AND c.slug = @slug", connection);
        command.Parameters.AddWithValue("@slug", slug);
        return await command.ReadSingleAsync(ReadRow, ct);
    }

    private static TourCollectionRow ReadRow(MySqlDataReader reader) => new(
        reader.GetUInt64("id"),
        new TourCollectionDto(
            reader.GetString("slug"),
            reader.GetString("name"),
            reader.GetNullableString("tagline"),
            reader.GetNullableString("season_label"),
            reader.GetNullableString("cover_place"),
            reader.GetInt32("tour_count")));
}
