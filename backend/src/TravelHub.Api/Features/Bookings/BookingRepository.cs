using System.Text;
using MySqlConnector;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin;

namespace TravelHub.Api.Features.Bookings;

public sealed record BookingDetailRow(BookingSummaryDto Summary, decimal Subtotal, decimal DiscountTotal,
    ulong CustomerId, ulong? SellingBranchId, ulong? BranchRegionId, string? ConfirmationCode,
    BookingSnapshot? Snapshot, IReadOnlyList<PassengerDto> Passengers);

public sealed record StaffBookingFilter(string? ItemStatus, string? ServiceType);

public sealed class BookingRepository(MySqlConnectionFactory connections)
{
    private const int MaxCustomerOrders = 100;

    // Each order has exactly one item in this version; the subquery keeps the join one row per order.
    private const string SummarySelect = """
        SELECT b.id, b.booking_code, b.status, b.subtotal, b.discount_total, b.total, b.created_at,
            b.customer_id, b.selling_branch_id, br.region_id AS branch_region_id,
            i.id AS item_id, i.service_type, i.status AS item_status, i.supplier_confirmation_code, i.price_snapshot,
            u.full_name, u.email, u.phone
        FROM bookings b
        JOIN booking_items i ON i.id = (SELECT MIN(x.id) FROM booking_items x WHERE x.booking_id = b.id)
        JOIN users u ON u.id = b.customer_id
        LEFT JOIN branches br ON br.id = b.selling_branch_id
        """;

    public async Task<BookingWriteSession> BeginWriteAsync(CancellationToken ct)
    {
        var connection = await connections.OpenAsync(ct);
        try
        {
            var transaction = await connection.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted, ct);
            return new BookingWriteSession(connection, transaction);
        }
        catch
        {
            await connection.DisposeAsync();
            throw;
        }
    }

    public async Task<IReadOnlyList<BookingSummaryDto>> ListForCustomerAsync(ulong customerId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect
            + " WHERE b.customer_id = @customer ORDER BY b.created_at DESC, b.id DESC LIMIT " + MaxCustomerOrders,
            connection);
        command.Parameters.AddWithValue("@customer", customerId);
        return await command.ReadAllAsync(reader => ReadSummary(reader, includeCustomer: false), ct);
    }

    public async Task<IReadOnlyList<BookingSummaryDto>> ListForStaffAsync(StaffScope scope, StaffBookingFilter filter,
        CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand { Connection = connection };
        var sql = new StringBuilder(SummarySelect).Append(" WHERE 1 = 1");
        scope.AppendFilter(sql, command, "b.selling_branch_id");
        if (filter.ItemStatus is not null)
        {
            sql.Append(" AND i.status = @itemStatus");
            command.Parameters.AddWithValue("@itemStatus", filter.ItemStatus);
        }
        if (filter.ServiceType is not null)
        {
            sql.Append(" AND i.service_type = @serviceType");
            command.Parameters.AddWithValue("@serviceType", filter.ServiceType);
        }
        sql.Append(" ORDER BY b.created_at DESC, b.id DESC LIMIT ").Append(BookingLimits.MaxStaffListSize);
        command.CommandText = sql.ToString();
        return await command.ReadAllAsync(reader => ReadSummary(reader, includeCustomer: true), ct);
    }

    public async Task<BookingDetailRow?> FindDetailAsync(ulong bookingId, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var command = new MySqlCommand(SummarySelect + " WHERE b.id = @id", connection);
        command.Parameters.AddWithValue("@id", bookingId);
        var row = await command.ReadSingleAsync(ReadDetail, ct);
        if (row is null) return null;
        return row with { Passengers = await ListPassengersAsync(connection, bookingId, ct) };
    }

    private static async Task<IReadOnlyList<PassengerDto>> ListPassengersAsync(MySqlConnection connection,
        ulong bookingId, CancellationToken ct)
    {
        await using var command = new MySqlCommand("""
            SELECT p.full_name, p.passenger_type, p.birth_date
            FROM booking_passengers p JOIN booking_items i ON i.id = p.booking_item_id
            WHERE i.booking_id = @id ORDER BY p.id
            """, connection);
        command.Parameters.AddWithValue("@id", bookingId);
        return await command.ReadAllAsync(r => new PassengerDto(r.GetString("full_name"),
            r.GetString("passenger_type"), r.GetNullableDateOnly("birth_date")), ct);
    }

    private static BookingSummaryDto ReadSummary(MySqlDataReader reader, bool includeCustomer)
    {
        var snapshot = BookingSnapshotReader.Read(reader.GetNullableString("price_snapshot"));
        var customer = includeCustomer
            ? new BookingCustomerDto(reader.GetId("customer_id"), reader.GetString("full_name"),
                reader.GetString("email"), reader.GetNullableString("phone"))
            : null;
        return new BookingSummaryDto(reader.GetId("id"), reader.GetString("booking_code"),
            reader.GetString("service_type"), reader.GetString("status"), reader.GetString("item_status"),
            snapshot?.Title ?? reader.GetString("booking_code"), snapshot?.Subtitle, snapshot?.StartDate,
            reader.GetDecimal("total"), reader.GetUtcDateTime("created_at"), customer);
    }

    private static BookingDetailRow ReadDetail(MySqlDataReader reader) => new(
        ReadSummary(reader, includeCustomer: true),
        reader.GetDecimal("subtotal"),
        reader.GetDecimal("discount_total"),
        reader.GetUInt64("customer_id"),
        reader.IsDBNull(reader.GetOrdinal("selling_branch_id")) ? null : reader.GetUInt64("selling_branch_id"),
        reader.IsDBNull(reader.GetOrdinal("branch_region_id")) ? null : reader.GetUInt64("branch_region_id"),
        reader.GetNullableString("supplier_confirmation_code"),
        BookingSnapshotReader.Read(reader.GetNullableString("price_snapshot")),
        []);
}
