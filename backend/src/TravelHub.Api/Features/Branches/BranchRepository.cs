using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Branches;

public sealed class BranchRepository(MySqlConnectionFactory connections)
{
    private const string ActiveBranchesSql = """
        SELECT b.id, b.code, b.name, b.address, r.name AS region_name,
            b.latitude, b.longitude, b.phone, b.opening_hours
        FROM branches b
        LEFT JOIN regions r ON r.id = b.region_id AND r.is_active = TRUE
        WHERE b.is_active = TRUE
        ORDER BY r.id IS NULL, r.id, b.id
        """;

    public async Task<IReadOnlyList<BranchDto>> ListActiveAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(ActiveBranchesSql, connection);
        return await command.ReadAllAsync(ReadBranch, ct);
    }

    private static BranchDto ReadBranch(MySqlDataReader reader) => new(
        reader.GetId("id"),
        reader.GetString("code"),
        reader.GetString("name"),
        reader.GetNullableString("address"),
        reader.GetNullableString("region_name"),
        reader.GetNullableDecimal("latitude"),
        reader.GetNullableDecimal("longitude"),
        reader.GetNullableString("phone"),
        reader.GetNullableString("opening_hours"));
}
