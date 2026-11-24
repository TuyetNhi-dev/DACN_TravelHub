using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Admin.CheckIn;

/// <summary>Check-in board, ticket lookup and check-in writes (migration 017).</summary>
public sealed class CheckInRepository(MySqlConnectionFactory connections)
{
    private const string AlreadyCheckedIn = "Có hành khách đã check-in trước đó. Tải lại danh sách để xem.";

    /// <summary>Paid orders of the departure with their passengers and who checked each one in.</summary>
    public async Task<IReadOnlyList<CheckInBookingDto>> ListBoardAsync(ulong departureId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand($"""
            SELECT b.id AS booking_id, b.booking_code, u.full_name AS contact_name, u.phone, p.id AS passenger_id,
                p.full_name, p.passenger_type, c.checked_in_at, actor.full_name AS checked_in_by
            FROM tour_booking_details td
            JOIN booking_items i ON i.id = td.booking_item_id
            JOIN bookings b ON b.id = i.booking_id
            JOIN users u ON u.id = b.customer_id
            JOIN booking_passengers p ON p.booking_item_id = i.id
            LEFT JOIN passenger_check_ins c ON c.passenger_id = p.id
            LEFT JOIN users actor ON actor.id = c.checked_in_by
            WHERE td.tour_departure_id = @departure AND i.status = '{BookingItemStatus.Confirmed}'
            ORDER BY b.booking_code, p.id
            """, connection);
        command.Parameters.AddWithValue("@departure", departureId);
        var rows = await command.ReadAllAsync(r => (BookingId: r.GetId("booking_id"),
            Code: r.GetString("booking_code"), Contact: r.GetString("contact_name"),
            Phone: r.GetNullableString("phone"),
            Passenger: new CheckInPassengerDto(r.GetId("passenger_id"), r.GetString("full_name"),
                r.GetString("passenger_type"), r.GetNullableUtcDateTime("checked_in_at"),
                r.GetNullableString("checked_in_by"))), ct);
        return rows.GroupBy(row => row.BookingId)
            .Select(g => new CheckInBookingDto(g.Key, g.First().Code, g.First().Contact, g.First().Phone,
                g.Select(row => row.Passenger).ToList()))
            .ToList();
    }

    public async Task<TicketLookupRow?> FindTicketAsync(string ticketCode, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand("""
            SELECT i.booking_id, t.version, i.status, td.tour_departure_id
            FROM tour_tickets t
            JOIN booking_items i ON i.id = t.booking_item_id
            JOIN tour_booking_details td ON td.booking_item_id = i.id
            WHERE t.ticket_code = @code
            """, connection);
        command.Parameters.AddWithValue("@code", ticketCode);
        return await command.ReadSingleAsync(r => new TicketLookupRow(r.GetId("booking_id"), r.GetInt32("version"),
            r.GetString("status"), r.GetUInt64("tour_departure_id")), ct);
    }

    /// <summary>
    /// Checks the passengers in and writes one audit row per order, all in one transaction. Every passenger must be on
    /// a paid order of this departure (404 otherwise); one already checked in rolls everything back (409).
    /// </summary>
    public Task<int> CheckInAsync(ulong departureId, IReadOnlyList<ulong> passengerIds, ulong actorId,
        Func<CheckInTargetRow, int, AuditEntry> audit, CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            var targets = await LockTargetsAsync(tx, departureId, passengerIds, ct);
            if (targets.Count != passengerIds.Count)
                throw ApiException.NotFound("Không tìm thấy hành khách trong các đơn đã thanh toán của lịch này.");
            foreach (var target in targets) await InsertCheckInAsync(tx, target, actorId, ct);
            foreach (var order in targets.GroupBy(t => t.BookingId))
                await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit(order.First(), order.Count()), ct);
            return targets.Count;
        }, ct);

    /// <summary>Removes one check-in of this departure and audits it; 404 when the passenger is not checked in.</summary>
    public Task<bool> UndoAsync(ulong departureId, ulong passengerId, Func<CheckInTargetRow, int, AuditEntry> audit,
        CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            await using var find = tx.Command("""
                SELECT c.passenger_id, c.booking_item_id, b.id AS booking_id, b.booking_code
                FROM passenger_check_ins c
                JOIN tour_booking_details td ON td.booking_item_id = c.booking_item_id
                JOIN booking_items i ON i.id = c.booking_item_id
                JOIN bookings b ON b.id = i.booking_id
                WHERE c.passenger_id = @passenger AND td.tour_departure_id = @departure
                FOR UPDATE
                """, ("@passenger", passengerId), ("@departure", departureId));
            var target = await find.ReadSingleAsync(ReadTarget, ct)
                ?? throw ApiException.NotFound("Hành khách này chưa check-in.");
            await tx.ExecuteAsync("DELETE FROM passenger_check_ins WHERE passenger_id = @passenger", ct,
                ("@passenger", passengerId));
            await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit(target, 1), ct);
            return true;
        }, ct);

    /// <summary>
    /// The requested passengers that sit on a paid order of the departure. FOR SHARE keeps the order from being
    /// cancelled between this check and the commit.
    /// </summary>
    private static async Task<IReadOnlyList<CheckInTargetRow>> LockTargetsAsync(Transaction tx, ulong departureId,
        IReadOnlyList<ulong> passengerIds, CancellationToken ct)
    {
        var names = passengerIds.Select((_, i) => "@passenger" + i).ToList();
        await using var command = tx.Command($"""
            SELECT p.id AS passenger_id, p.booking_item_id, b.id AS booking_id, b.booking_code
            FROM booking_passengers p
            JOIN booking_items i ON i.id = p.booking_item_id
            JOIN tour_booking_details td ON td.booking_item_id = i.id
            JOIN bookings b ON b.id = i.booking_id
            WHERE td.tour_departure_id = @departure AND i.status = '{BookingItemStatus.Confirmed}'
              AND p.id IN ({string.Join(", ", names)})
            ORDER BY p.id
            FOR SHARE
            """, ("@departure", departureId));
        for (var i = 0; i < names.Count; i++) command.Parameters.AddWithValue(names[i], passengerIds[i]);
        return await command.ReadAllAsync(ReadTarget, ct);
    }

    private static async Task InsertCheckInAsync(Transaction tx, CheckInTargetRow target, ulong actorId,
        CancellationToken ct)
    {
        try
        {
            await tx.ExecuteAsync("""
                INSERT INTO passenger_check_ins (passenger_id, booking_item_id, checked_in_by)
                VALUES (@passenger, @item, @actor)
                """, ct, ("@passenger", target.PassengerId), ("@item", target.ItemId), ("@actor", actorId));
        }
        catch (MySqlException exception) when (exception.ErrorCode == MySqlErrorCode.DuplicateKeyEntry)
        {
            // The primary key is the guard against a second scan, including one racing this request.
            throw ApiException.Conflict(AlreadyCheckedIn);
        }
    }

    private static CheckInTargetRow ReadTarget(MySqlDataReader r) => new(r.GetUInt64("passenger_id"),
        r.GetUInt64("booking_item_id"), r.GetId("booking_id"), r.GetString("booking_code"));
}
