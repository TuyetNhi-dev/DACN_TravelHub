using System.Text.Json;
using MySqlConnector;

namespace TravelHub.Api.Features.Admin.Audit;

/// <summary>
/// Writes an audit row on the caller's connection and transaction, so the change and its log commit or roll back
/// together. Rows are only ever inserted.
/// </summary>
public static class AuditLogWriter
{
    public const int MaxSummaryLength = 500;

    public static async Task WriteAsync(MySqlConnection connection, MySqlTransaction transaction, AuditEntry entry,
        CancellationToken ct)
    {
        await using var command = new MySqlCommand("""
            INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, branch_id, region_id, summary,
                changes)
            VALUES (@actor, @action, @entityType, @entityId, @branch, @region, @summary, @changes)
            """, connection, transaction);
        command.Parameters.AddWithValue("@actor", entry.ActorId);
        command.Parameters.AddWithValue("@action", entry.Action);
        command.Parameters.AddWithValue("@entityType", entry.EntityType);
        command.Parameters.AddWithValue("@entityId", entry.EntityId);
        command.Parameters.AddWithValue("@branch", entry.BranchId);
        command.Parameters.AddWithValue("@region", entry.RegionId);
        command.Parameters.AddWithValue("@summary", Truncate(entry.Summary));
        command.Parameters.AddWithValue("@changes", ToJson(entry.Changes));
        await command.ExecuteNonQueryAsync(ct);
    }

    /// <summary>{"field": [old, new]}, the shape documented in migration 015.</summary>
    public static string? ToJson(IReadOnlyList<AuditChange>? changes) => changes is null or { Count: 0 }
        ? null
        : JsonSerializer.Serialize(changes.ToDictionary(c => c.Field, c => new[] { c.Old, c.New }));

    private static string Truncate(string summary) =>
        summary.Length <= MaxSummaryLength ? summary : summary[..(MaxSummaryLength - 1)] + "…";
}
