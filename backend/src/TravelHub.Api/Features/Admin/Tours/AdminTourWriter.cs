using TravelHub.Api.Data;
using TravelHub.Api.Features.Admin.Audit;

namespace TravelHub.Api.Features.Admin.Tours;

/// <summary>
/// Writes of the tour editor. Every method runs in one transaction together with its audit row, so a failed change
/// leaves neither data nor log behind.
/// </summary>
public sealed class AdminTourWriter(MySqlConnectionFactory connections)
{
    private const string TourColumns = "code, title, destination_id, category_id, operating_branch_id, "
        + "duration_days, duration_nights, base_price, description, cancellation_policy, travel_notes";

    public Task<ulong> InsertAsync(ValidTour tour, Func<ulong, AuditEntry> audit, CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            var id = await tx.InsertAsync($"INSERT INTO tours ({TourColumns}, status) VALUES (@code, @title, "
                + "@destination, @category, @branch, @days, @nights, @price, @description, @cancellation, @notes, "
                + "'draft')", ct,
                Values(tour));
            await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit(id), ct);
            return id;
        }, ct);

    public Task<bool> UpdateAsync(ulong id, ValidTour tour, AuditEntry audit, CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            var rows = await tx.ExecuteAsync("""
                UPDATE tours SET code = @code, title = @title, destination_id = @destination, category_id = @category,
                    operating_branch_id = @branch, duration_days = @days, duration_nights = @nights,
                    base_price = @price, description = @description, cancellation_policy = @cancellation,
                    travel_notes = @notes
                WHERE id = @id
                """, ct, [.. Values(tour), ("@id", id)]);
            if (rows > 0) await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit, ct);
            return rows > 0;
        }, ct);

    public Task<bool> SetStatusAsync(ulong id, string status, AuditEntry audit, CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            var rows = await tx.ExecuteAsync("UPDATE tours SET status = @status WHERE id = @id", ct,
                ("@status", status), ("@id", id));
            if (rows > 0) await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit, ct);
            return rows > 0;
        }, ct);

    /// <summary>A draft copy with its photos, itinerary, inclusions and transport; departures are not copied.</summary>
    public Task<ulong> CloneAsync(ulong sourceId, string code, Func<ulong, AuditEntry> audit, CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            var id = await tx.InsertAsync($"""
                INSERT INTO tours ({TourColumns}, status)
                SELECT @code, CONCAT(title, ' (bản sao)'), destination_id, category_id, operating_branch_id,
                    duration_days, duration_nights, base_price, description, cancellation_policy, travel_notes, 'draft'
                FROM tours WHERE id = @source
                """, ct, ("@code", code), ("@source", sourceId));
            foreach (var (table, columns) in CopiedChildren)
            {
                await tx.ExecuteAsync($"INSERT INTO {table} (tour_id, {columns}) "
                    + $"SELECT @id, {columns} FROM {table} WHERE tour_id = @source", ct,
                    ("@id", id), ("@source", sourceId));
            }
            await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit(id), ct);
            return id;
        }, ct);

    private static readonly (string Table, string Columns)[] CopiedChildren =
    [
        ("tour_transport_types", "transport_type_id"),
        ("tour_itinerary_days", "day_number, title, description"),
        ("tour_images", "image_url, alt_text, sort_order"),
        ("tour_inclusions", "service_type, description, is_included"),
    ];

    public Task ReplaceImagesAsync(ulong id, IReadOnlyList<AdminTourImageDto> images, AuditEntry audit,
        CancellationToken ct) => ReplaceAsync(id, "tour_images", "image_url, alt_text, sort_order", audit,
        images.Select((image, index) => new object?[] { image.Url, image.AltText, index }), ct);

    public Task ReplaceItineraryAsync(ulong id, IReadOnlyList<AdminItineraryDayDto> days, AuditEntry audit,
        CancellationToken ct) => ReplaceAsync(id, "tour_itinerary_days", "day_number, title, description", audit,
        days.Select(day => new object?[] { day.DayNumber, day.Title, day.Description }), ct);

    public Task ReplaceInclusionsAsync(ulong id, IReadOnlyList<AdminInclusionDto> items, AuditEntry audit,
        CancellationToken ct) => ReplaceAsync(id, "tour_inclusions", "service_type, description, is_included",
        audit, items.Select(item => new object?[] { item.ServiceType, item.Description, item.IsIncluded }), ct);

    /// <param name="table">One of the three child tables above; table and columns are written in code.</param>
    private Task ReplaceAsync(ulong id, string table, string columns, AuditEntry audit,
        IEnumerable<object?[]> rows, CancellationToken ct) =>
        connections.InTransactionAsync(async tx =>
        {
            await tx.ExecuteAsync($"DELETE FROM {table} WHERE tour_id = @id", ct, ("@id", id));
            foreach (var row in rows)
            {
                var names = row.Select((_, index) => "@p" + index).ToArray();
                (string, object?)[] values = [("@id", id), .. row.Select((value, index) => (names[index], value))];
                await tx.ExecuteAsync($"INSERT INTO {table} (tour_id, {columns}) VALUES (@id, "
                    + string.Join(", ", names) + ")", ct, values);
            }
            await AuditLogWriter.WriteAsync(tx.Connection, tx.Inner, audit, ct);
            return true;
        }, ct);

    private static (string, object?)[] Values(ValidTour tour) =>
    [
        ("@code", tour.Code), ("@title", tour.Title), ("@destination", tour.DestinationId),
        ("@category", tour.CategoryId), ("@branch", tour.OperatingBranchId), ("@days", tour.DurationDays),
        ("@nights", tour.DurationNights), ("@price", tour.BasePrice), ("@description", tour.Description),
        ("@cancellation", tour.CancellationPolicy), ("@notes", tour.TravelNotes),
    ];
}
