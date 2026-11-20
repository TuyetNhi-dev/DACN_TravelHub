using System.Text;
using System.Text.Json;
using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.ServiceRequests;

public sealed class ServiceRequestRepository(MySqlConnectionFactory connections)
{
    private const int DuplicateKeyError = 1062;

    private const string SummarySelect = """
        SELECT r.id, r.request_code, r.service_type, r.full_name, r.phone, r.email, r.status,
            r.assigned_user_id, u.full_name AS assigned_name, r.created_at, r.updated_at
        FROM service_requests r
        LEFT JOIN users u ON u.id = r.assigned_user_id
        """;

    /// <summary>Inserts a new request; false when the generated code already exists (caller retries).</summary>
    public async Task<bool> TryInsertAsync(ValidServiceRequest request, string code, DateTime nowUtc,
        CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            INSERT INTO service_requests (request_code, service_type, full_name, phone, email, customer_note,
                details, consent_at, status, created_at, updated_at)
            VALUES (@code, @type, @name, @phone, @email, @note, @details, @now, 'new', @now, @now)
            """, connection);
        command.Parameters.AddWithValue("@code", code);
        command.Parameters.AddWithValue("@type", request.ServiceType);
        command.Parameters.AddWithValue("@name", request.FullName);
        command.Parameters.AddWithValue("@phone", request.Phone);
        command.Parameters.AddWithValue("@email", request.Email);
        command.Parameters.AddWithValue("@note", request.Note);
        command.Parameters.AddWithValue("@details", request.DetailsJson);
        command.Parameters.AddWithValue("@now", nowUtc);
        try
        {
            await command.ExecuteNonQueryAsync(ct);
            return true;
        }
        catch (MySqlException ex) when (ex.Number == DuplicateKeyError)
        {
            return false;
        }
    }

    public async Task<(IReadOnlyList<ServiceRequestSummaryDto> Rows, int Total)> ListAsync(
        ServiceRequestFilter filter, int offset, int limit, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var count = new MySqlCommand("", connection);
        count.CommandText = "SELECT COUNT(*) FROM service_requests r" + Where(filter, count);
        var total = Convert.ToInt32(await count.ExecuteScalarAsync(ct));

        await using var list = new MySqlCommand("", connection);
        list.CommandText = SummarySelect + Where(filter, list)
            + " ORDER BY r.created_at DESC, r.id DESC LIMIT @limit OFFSET @offset";
        list.Parameters.AddWithValue("@limit", limit);
        list.Parameters.AddWithValue("@offset", offset);
        return (await list.ReadAllAsync(ReadSummary, ct), total);
    }

    public async Task<int> CountByStatusAsync(string status, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(
            "SELECT COUNT(*) FROM service_requests WHERE status = @status", connection);
        command.Parameters.AddWithValue("@status", status);
        return Convert.ToInt32(await command.ExecuteScalarAsync(ct));
    }

    public async Task<ServiceRequestDetailDto?> FindAsync(ulong id, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect.Replace("SELECT r.id,",
            "SELECT r.customer_note, r.details, r.consent_at, r.id,") + " WHERE r.id = @id", connection);
        command.Parameters.AddWithValue("@id", id);
        var head = await command.ReadSingleAsync(reader => new
        {
            Summary = ReadSummary(reader),
            Note = reader.GetNullableString("customer_note"),
            Details = ParseJson(reader.GetString("details")),
            ConsentAt = reader.GetUtcDateTime("consent_at"),
        }, ct);
        if (head is null) return null;

        await using var notes = new MySqlCommand("""
            SELECT n.id, n.note, n.created_at, u.full_name AS author_name
            FROM service_request_notes n
            JOIN users u ON u.id = n.author_user_id
            WHERE n.service_request_id = @id
            ORDER BY n.created_at, n.id
            """, connection);
        notes.Parameters.AddWithValue("@id", id);
        var noteRows = await notes.ReadAllAsync(reader => new ServiceRequestNoteDto(reader.GetId("id"),
            reader.GetString("author_name"), reader.GetString("note"), reader.GetUtcDateTime("created_at")), ct);
        return new ServiceRequestDetailDto(head.Summary, head.Note, head.Details, head.ConsentAt, noteRows);
    }

    /// <summary>False when no request has this id.</summary>
    public async Task<bool> UpdateStatusAsync(ulong id, string status, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(
            "UPDATE service_requests SET status = @status WHERE id = @id", connection);
        command.Parameters.AddWithValue("@status", status);
        command.Parameters.AddWithValue("@id", id);
        // MySqlConnector reports matched rows by default, so an unchanged status still counts as found.
        return await command.ExecuteNonQueryAsync(ct) > 0;
    }

    /// <summary>Sets or clears (null) the staff member in charge; false when no request has this id.</summary>
    public async Task<bool> AssignAsync(ulong id, ulong? userId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(
            "UPDATE service_requests SET assigned_user_id = @user WHERE id = @id", connection);
        command.Parameters.AddWithValue("@user", userId);
        command.Parameters.AddWithValue("@id", id);
        return await command.ExecuteNonQueryAsync(ct) > 0;
    }

    /// <summary>Appends a note (notes are never edited or deleted); false when no request has this id.</summary>
    public async Task<bool> AddNoteAsync(ulong id, ulong authorId, string note, DateTime nowUtc, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            INSERT INTO service_request_notes (service_request_id, author_user_id, note, created_at)
            SELECT id, @author, @note, @now FROM service_requests WHERE id = @id
            """, connection);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@author", authorId);
        command.Parameters.AddWithValue("@note", note);
        command.Parameters.AddWithValue("@now", nowUtc);
        return await command.ExecuteNonQueryAsync(ct) > 0;
    }

    private static string Where(ServiceRequestFilter filter, MySqlCommand command)
    {
        var sql = new StringBuilder(" WHERE 1 = 1");
        if (filter.ServiceType is not null)
        {
            sql.Append(" AND r.service_type = @type");
            command.Parameters.AddWithValue("@type", filter.ServiceType);
        }
        if (filter.Status is not null)
        {
            sql.Append(" AND r.status = @status");
            command.Parameters.AddWithValue("@status", filter.Status);
        }
        if (filter.Query is not null)
        {
            sql.Append(" AND (r.request_code = @code OR r.full_name LIKE @like OR r.phone LIKE @like OR r.email LIKE @like)");
            command.Parameters.AddWithValue("@code", filter.Query.ToUpperInvariant());
            command.Parameters.AddWithValue("@like", "%" + EscapeLike(filter.Query) + "%");
        }
        return sql.ToString();
    }

    /// <summary>Makes % and _ typed by staff match literally (MySQL's default LIKE escape is backslash).</summary>
    public static string EscapeLike(string value) =>
        value.Replace(@"\", @"\\").Replace("%", @"\%").Replace("_", @"\_");

    private static JsonElement ParseJson(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static ServiceRequestSummaryDto ReadSummary(MySqlDataReader reader) => new(
        reader.GetId("id"),
        reader.GetString("request_code"),
        reader.GetString("service_type"),
        reader.GetString("full_name"),
        reader.GetString("phone"),
        reader.GetNullableString("email"),
        reader.GetString("status"),
        reader.GetNullableId("assigned_user_id"),
        reader.GetNullableString("assigned_name"),
        reader.GetUtcDateTime("created_at"),
        reader.GetUtcDateTime("updated_at"));
}
