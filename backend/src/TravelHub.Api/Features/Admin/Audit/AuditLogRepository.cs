using System.Text;
using System.Text.Json;
using MySqlConnector;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin.Access;

namespace TravelHub.Api.Features.Admin.Audit;

public sealed record AuditLogDto(string Id, DateTime CreatedAt, string ActorName, string Action, string EntityType,
    string EntityId, string? BranchName, string Summary, IReadOnlyList<AuditChange> Changes);

public sealed record AuditLogFilter(ScopeSet Scope, string? EntityType, ulong? ActorId, DateTime? FromUtc,
    DateTime? ToUtc);

public sealed class AuditLogRepository(MySqlConnectionFactory connections)
{
    public async Task<(IReadOnlyList<AuditLogDto> Rows, int Total)> ListAsync(AuditLogFilter filter, int offset,
        int limit, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var count = new MySqlCommand { Connection = connection };
        count.CommandText = "SELECT COUNT(*) FROM audit_logs a" + Where(filter, count);
        var total = Convert.ToInt32(await count.ExecuteScalarAsync(ct));

        await using var command = new MySqlCommand { Connection = connection };
        command.CommandText = """
            SELECT a.id, a.created_at, u.full_name AS actor_name, a.action, a.entity_type, a.entity_id,
                b.name AS branch_name, a.summary, a.changes
            FROM audit_logs a JOIN users u ON u.id = a.actor_user_id LEFT JOIN branches b ON b.id = a.branch_id
            """ + Where(filter, command) + " ORDER BY a.created_at DESC, a.id DESC LIMIT @limit OFFSET @offset";
        command.Parameters.AddWithValue("@limit", limit);
        command.Parameters.AddWithValue("@offset", offset);
        return (await command.ReadAllAsync(Read, ct), total);
    }

    private static string Where(AuditLogFilter filter, MySqlCommand command)
    {
        var sql = new StringBuilder(" WHERE 1 = 1");
        ScopeSql.AppendBranchFilter(sql, command, "a.branch_id", filter.Scope);
        SqlFilter.AddIfPresent(sql, command, "a.entity_type = @entityType", "@entityType", filter.EntityType);
        SqlFilter.AddIfPresent(sql, command, "a.actor_user_id = @actor", "@actor", filter.ActorId);
        SqlFilter.AddIfPresent(sql, command, "a.created_at >= @from", "@from", filter.FromUtc);
        SqlFilter.AddIfPresent(sql, command, "a.created_at < @to", "@to", filter.ToUtc);
        return sql.ToString();
    }

    private static AuditLogDto Read(MySqlDataReader r) => new(r.GetId("id"), r.GetUtcDateTime("created_at"),
        r.GetString("actor_name"), r.GetString("action"), r.GetString("entity_type"), r.GetString("entity_id"),
        r.GetNullableString("branch_name"), r.GetString("summary"), ParseChanges(r.GetNullableString("changes")));

    public static IReadOnlyList<AuditChange> ParseChanges(string? json)
    {
        if (string.IsNullOrEmpty(json)) return [];
        var map = JsonSerializer.Deserialize<Dictionary<string, string?[]>>(json) ?? [];
        return map.Select(pair => new AuditChange(pair.Key, pair.Value.ElementAtOrDefault(0),
            pair.Value.ElementAtOrDefault(1))).ToList();
    }
}
