using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Admin.Access;

public sealed record RegionRef(ulong Id, string Code, string Name);

/// <summary>Where <see cref="AdminAccessService"/> reads the branch tree; tests pass a fixed list, not MySQL.</summary>
public interface IBranchDirectory
{
    Task<IReadOnlyList<BranchRef>> ListBranchesAsync(CancellationToken ct);
}

/// <summary>Regions and branches: a few rows, read once per request by <see cref="AdminAccessService"/>.</summary>
public sealed class OrganizationRepository(MySqlConnectionFactory connections) : IBranchDirectory
{
    public async Task<IReadOnlyList<BranchRef>> ListBranchesAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT b.id, b.code, b.name, r.id AS region_id, r.code AS region_code, r.name AS region_name
            FROM branches b LEFT JOIN regions r ON r.id = b.region_id
            WHERE b.is_active = 1
            ORDER BY r.id, b.name
            """, connection);
        return await command.ReadAllAsync(r => new BranchRef(r.GetUInt64("id"), r.GetString("code"),
            r.GetString("name"), r.IsDBNull(r.GetOrdinal("region_id")) ? null : r.GetUInt64("region_id"),
            r.GetNullableString("region_code"), r.GetNullableString("region_name")), ct);
    }

    public async Task<IReadOnlyList<RegionRef>> ListRegionsAsync(CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(
            "SELECT id, code, name FROM regions WHERE is_active = 1 ORDER BY id", connection);
        return await command.ReadAllAsync(r => new RegionRef(r.GetUInt64("id"), r.GetString("code"),
            r.GetString("name")), ct);
    }
}
