using MySqlConnector;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin.Audit;

namespace TravelHub.Api.Features.Admin.Bookings;

public sealed record BookingOwnerRow(ulong? SellingBranchId, string Code, string CustomerName, DateTime CreatedAt);

/// <summary>Payments, back-office history and internal notes of one order (migration 016 adds booking_notes).</summary>
public sealed class BookingActivityRepository(MySqlConnectionFactory connections)
{
    public async Task<BookingOwnerRow?> FindAsync(ulong bookingId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT b.selling_branch_id, b.booking_code, u.full_name, b.created_at
            FROM bookings b JOIN users u ON u.id = b.customer_id WHERE b.id = @id
            """, connection);
        command.Parameters.AddWithValue("@id", bookingId);
        return await command.ReadSingleAsync(r => new BookingOwnerRow(
            r.IsDBNull(r.GetOrdinal("selling_branch_id")) ? null : r.GetUInt64("selling_branch_id"),
            r.GetString("booking_code"), r.GetString("full_name"), r.GetUtcDateTime("created_at")), ct);
    }

    public async Task<BookingActivityDto> ReadAsync(BookingOwnerRow owner, ulong bookingId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        var payments = await ListAsync(connection, """
            SELECT id, provider, amount, status, paid_at, created_at FROM payments
            WHERE booking_id = @id ORDER BY created_at, id
            """, bookingId, r => new BookingPaymentDto(r.GetId("id"), r.GetString("provider"), r.GetDecimal("amount"),
            r.GetString("status"), r.GetNullableUtcDateTime("paid_at"), r.GetUtcDateTime("created_at")), ct);
        var changes = await ListAsync(connection, $"""
            SELECT a.created_at, u.full_name, a.action, a.summary
            FROM audit_logs a JOIN users u ON u.id = a.actor_user_id
            WHERE a.entity_type = '{AuditEntities.Booking}' AND a.entity_id = @id
                AND a.action <> '{AuditActions.BookingNote}'
            """, bookingId, r => new BookingHistoryDto(r.GetUtcDateTime("created_at"), r.GetString("full_name"),
            r.GetString("action"), r.GetString("summary")), ct);
        var notes = await ListAsync(connection, """
            SELECT n.id, u.full_name, n.body, n.created_at
            FROM booking_notes n JOIN users u ON u.id = n.author_user_id
            WHERE n.booking_id = @id ORDER BY n.created_at DESC, n.id DESC
            """, bookingId, r => new BookingNoteDto(r.GetId("id"), r.GetString("full_name"), r.GetString("body"),
            r.GetUtcDateTime("created_at")), ct);
        return new BookingActivityDto(payments,
            BookingNoteRules.History(owner.CreatedAt, owner.CustomerName, changes), notes);
    }

    /// <summary>Adds the note and its audit row in one transaction (the audit summary never repeats the text).</summary>
    public Task<ulong> AddNoteAsync(ulong bookingId, ulong authorId, string text, AuditEntry audit,
        CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            var id = await tx.InsertAsync(
                "INSERT INTO booking_notes (booking_id, author_user_id, body) VALUES (@booking, @author, @body)", ct,
                ("@booking", bookingId), ("@author", authorId), ("@body", text));
            await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit, ct);
            return id;
        }, ct);

    private static async Task<IReadOnlyList<T>> ListAsync<T>(MySqlConnection connection, string sql, ulong bookingId,
        Func<MySqlDataReader, T> read, CancellationToken ct)
    {
        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@id", bookingId);
        return await command.ReadAllAsync(read, ct);
    }
}
