using System.Text.Json;
using System.Text.Json.Serialization;
using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Bookings;

/// <summary>
/// One MySQL transaction for creating or changing an order. Disposing without <see cref="CommitAsync"/>
/// rolls everything back, including any seats reserved earlier in the same session.
/// </summary>
public sealed class BookingWriteSession(MySqlConnection connection, MySqlTransaction transaction) : IAsyncDisposable
{
    private const int DuplicateKeyError = 1062;
    private const int MaxCodeAttempts = 3;
    public static readonly JsonSerializerOptions SnapshotJson = new(JsonSerializerDefaults.Web);

    public async Task<bool> TryReserveSeatsAsync(ulong departureId, int seats, DateOnly today, CancellationToken ct)
    {
        // Single conditional UPDATE: the row lock makes concurrent bookings unable to oversell.
        await using var command = Command("""
            UPDATE tour_departures SET reserved_seats = reserved_seats + @seats
            WHERE id = @id AND status = 'open' AND departure_date > @today AND reserved_seats + @seats <= capacity
            """);
        command.Parameters.AddWithValue("@seats", seats);
        command.Parameters.AddWithValue("@id", departureId);
        command.Parameters.AddWithValue("@today", today);
        return await command.ExecuteNonQueryAsync(ct) == 1;
    }

    public async Task ReleaseSeatsAsync(ulong departureId, int seats, CancellationToken ct)
    {
        await using var command = Command("""
            UPDATE tour_departures SET reserved_seats = reserved_seats - @seats
            WHERE id = @id AND reserved_seats >= @seats
            """);
        command.Parameters.AddWithValue("@seats", seats);
        command.Parameters.AddWithValue("@id", departureId);
        if (await command.ExecuteNonQueryAsync(ct) != 1)
            throw new InvalidOperationException("Reserved seat counter is lower than the seats being released.");
    }

    public async Task<DepartureState?> FindDepartureStateAsync(ulong departureId, CancellationToken ct)
    {
        await using var command = Command(
            "SELECT status, departure_date, capacity, reserved_seats FROM tour_departures WHERE id = @id");
        command.Parameters.AddWithValue("@id", departureId);
        return await command.ReadSingleAsync(r => new DepartureState(r.GetString("status"),
            r.GetDateOnly("departure_date"), r.GetInt32("capacity"), r.GetInt32("reserved_seats")), ct);
    }

    public async Task<TourPricingRow> GetTourPricingAsync(ulong departureId, CancellationToken ct)
    {
        await using var command = Command("""
            SELECT t.title, t.code, t.operating_branch_id, l.name AS departure_from, d.departure_date,
                d.return_date, d.adult_price, d.child_price
            FROM tour_departures d
            JOIN tours t ON t.id = d.tour_id
            JOIN locations l ON l.id = d.departure_location_id
            WHERE d.id = @id
            """);
        command.Parameters.AddWithValue("@id", departureId);
        return await command.ReadSingleAsync(r => new TourPricingRow(r.GetString("title"), r.GetString("code"),
                r.GetUInt64("operating_branch_id"), r.GetString("departure_from"), r.GetDateOnly("departure_date"),
                r.GetDateOnly("return_date"), r.GetDecimal("adult_price"), r.GetNullableDecimal("child_price")), ct)
            ?? throw new InvalidOperationException("Reserved departure disappeared inside the transaction.");
    }

    /// <summary>Cheapest active VND offer valid for every night of the stay [checkIn, lastNight].</summary>
    public async Task<HotelQuoteRow?> FindHotelQuoteAsync(ulong roomTypeId, DateOnly checkIn, DateOnly lastNight,
        CancellationToken ct)
    {
        await using var command = Command("""
            SELECT r.name AS room_name, h.name AS hotel_name, l.name AS city, r.max_guests,
                o.id AS offer_id, o.nightly_price, o.terms
            FROM room_types r
            JOIN hotels h ON h.id = r.hotel_id AND h.status = 'active'
            JOIN locations l ON l.id = h.location_id
            LEFT JOIN hotel_offers o ON o.id = (
                SELECT offer.id FROM hotel_offers offer
                WHERE offer.room_type_id = r.id AND offer.status = 'active' AND offer.currency = 'VND'
                  AND offer.valid_from <= @checkIn AND offer.valid_to >= @lastNight
                ORDER BY offer.nightly_price, offer.id LIMIT 1)
            WHERE r.id = @id
            """);
        command.Parameters.AddWithValue("@id", roomTypeId);
        command.Parameters.AddWithValue("@checkIn", checkIn);
        command.Parameters.AddWithValue("@lastNight", lastNight);
        return await command.ReadSingleAsync(r => new HotelQuoteRow(r.GetString("room_name"),
            r.GetString("hotel_name"), r.GetString("city"), r.GetInt32("max_guests"),
            r.IsDBNull(r.GetOrdinal("offer_id")) ? null : r.GetUInt64("offer_id"),
            r.GetNullableDecimal("nightly_price"), r.GetNullableString("terms")), ct);
    }

    public async Task<FlightQuoteRow?> FindSellableFlightQuoteAsync(ulong offerId, DateTime nowUtc,
        CancellationToken ct)
    {
        await using var command = Command("""
            SELECT f.id AS flight_id, o.id AS offer_id, f.flight_number, a.name AS airline,
                origin.code AS origin_code, COALESCE(oc.name, origin.name) AS origin_city,
                destination.code AS destination_code, COALESCE(dc.name, destination.name) AS destination_city,
                f.depart_at, f.arrive_at, o.cabin_class, o.quoted_price,
                CONCAT_WS(' ', o.baggage_terms, o.change_cancel_terms) AS terms,
                o.allotment_seats - o.sold_seats AS remaining_seats
            FROM flight_offers o
            JOIN flights f ON f.id = o.flight_id
            JOIN airlines a ON a.id = f.airline_id
            JOIN locations origin ON origin.id = f.origin_location_id
            LEFT JOIN locations oc ON oc.id = origin.parent_id
            JOIN locations destination ON destination.id = f.destination_location_id
            LEFT JOIN locations dc ON dc.id = destination.parent_id
            WHERE o.id = @id AND o.status = 'active' AND o.currency = 'VND'
              AND (o.expires_at IS NULL OR o.expires_at > @now) AND f.depart_at > @now
              AND (o.allotment_seats IS NULL OR o.sold_seats < o.allotment_seats)
            """);
        command.Parameters.AddWithValue("@id", offerId);
        command.Parameters.AddWithValue("@now", nowUtc);
        return await command.ReadSingleAsync(ReadFlightQuote, ct);
    }

    public async Task<ulong> InsertBookingAsync(NewBooking booking, DateOnly today, CancellationToken ct)
    {
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                return await InsertBookingRowAsync(booking, BookingCodeGenerator.Create(today), ct);
            }
            catch (MySqlException ex) when (ex.Number == DuplicateKeyError && attempt < MaxCodeAttempts)
            {
                // Random code collided; MySQL rolls back only the failed statement, so simply retry.
            }
        }
    }

    public async Task<ulong> InsertItemAsync(ulong bookingId, NewBooking booking, CancellationToken ct)
    {
        await using var command = Command("""
            INSERT INTO booking_items (booking_id, service_type, status, quantity, unit_price, total_price,
                price_snapshot)
            VALUES (@bookingId, @type, @status, @quantity, @unitPrice, @total, @snapshot)
            """);
        command.Parameters.AddWithValue("@bookingId", bookingId);
        command.Parameters.AddWithValue("@type", booking.ServiceType);
        command.Parameters.AddWithValue("@status", BookingItemStatus.InitialFor(booking.HoldsSeats));
        command.Parameters.AddWithValue("@quantity", booking.Quote.Quantity);
        command.Parameters.AddWithValue("@unitPrice", booking.Quote.UnitPrice);
        command.Parameters.AddWithValue("@total", booking.Quote.Total);
        command.Parameters.AddWithValue("@snapshot", JsonSerializer.Serialize(booking.Snapshot, SnapshotJson));
        await command.ExecuteNonQueryAsync(ct);
        return (ulong)command.LastInsertedId;
    }

    public async Task InsertTourDetailAsync(ulong itemId, ValidTourRequest tour, CancellationToken ct)
    {
        await using var command = Command("""
            INSERT INTO tour_booking_details (booking_item_id, tour_departure_id, adult_count, child_count)
            VALUES (@item, @departure, @adults, @children)
            """);
        command.Parameters.AddWithValue("@item", itemId);
        command.Parameters.AddWithValue("@departure", tour.DepartureId);
        command.Parameters.AddWithValue("@adults", tour.Adults);
        command.Parameters.AddWithValue("@children", tour.Children);
        await command.ExecuteNonQueryAsync(ct);
    }

    public async Task InsertHotelDetailAsync(ulong itemId, ValidHotelRequest hotel, ulong offerId,
        CancellationToken ct)
    {
        await using var command = Command("""
            INSERT INTO hotel_booking_details (booking_item_id, room_type_id, hotel_offer_id, check_in, check_out,
                room_count, guest_count)
            VALUES (@item, @roomType, @offer, @checkIn, @checkOut, @rooms, @guests)
            """);
        command.Parameters.AddWithValue("@item", itemId);
        command.Parameters.AddWithValue("@roomType", hotel.RoomTypeId);
        command.Parameters.AddWithValue("@offer", offerId);
        command.Parameters.AddWithValue("@checkIn", hotel.CheckIn);
        command.Parameters.AddWithValue("@checkOut", hotel.CheckOut);
        command.Parameters.AddWithValue("@rooms", hotel.Rooms);
        command.Parameters.AddWithValue("@guests", hotel.Guests);
        await command.ExecuteNonQueryAsync(ct);
    }

    /// <summary>
    /// Takes seats from a deal's allotment. The guarded UPDATE is the concurrency control: two customers can never
    /// oversell the last seats. False means fewer than `seats` remain.
    /// </summary>
    public async Task<bool> TryTakeAllotmentSeatsAsync(ulong offerId, int seats, CancellationToken ct)
    {
        await using var command = Command("""
            UPDATE flight_offers SET sold_seats = sold_seats + @seats
            WHERE id = @id AND allotment_seats IS NOT NULL AND sold_seats + @seats <= allotment_seats
            """);
        command.Parameters.AddWithValue("@id", offerId);
        command.Parameters.AddWithValue("@seats", seats);
        return await command.ExecuteNonQueryAsync(ct) == 1;
    }

    public async Task ReleaseAllotmentSeatsAsync(ulong offerId, int seats, CancellationToken ct)
    {
        await using var command = Command("""
            UPDATE flight_offers SET sold_seats = sold_seats - @seats
            WHERE id = @id AND allotment_seats IS NOT NULL AND sold_seats >= @seats
            """);
        command.Parameters.AddWithValue("@id", offerId);
        command.Parameters.AddWithValue("@seats", seats);
        await command.ExecuteNonQueryAsync(ct);
    }

    /// <summary>Seats left on a deal right now, for the "only N left" message; null when it is not a deal.</summary>
    public async Task<int?> FindRemainingAllotmentAsync(ulong offerId, CancellationToken ct)
    {
        await using var command = Command("""
            SELECT allotment_seats - sold_seats AS remaining_seats FROM flight_offers WHERE id = @id
            """);
        command.Parameters.AddWithValue("@id", offerId);
        var value = await command.ExecuteScalarAsync(ct);
        return value is null or DBNull ? null : Convert.ToInt32(value);
    }

    public async Task InsertFlightDetailAsync(ulong itemId, FlightQuoteRow quote, CancellationToken ct)
    {
        await using var command = Command("""
            INSERT INTO flight_booking_details (booking_item_id, flight_id, flight_offer_id, cabin_class)
            VALUES (@item, @flight, @offer, @cabin)
            """);
        command.Parameters.AddWithValue("@item", itemId);
        command.Parameters.AddWithValue("@flight", quote.FlightId);
        command.Parameters.AddWithValue("@offer", quote.OfferId);
        command.Parameters.AddWithValue("@cabin", quote.CabinClass);
        await command.ExecuteNonQueryAsync(ct);
    }

    public async Task InsertPassengersAsync(ulong itemId, IEnumerable<ValidPassenger> passengers, CancellationToken ct)
    {
        await using var command = Command("""
            INSERT INTO booking_passengers (booking_item_id, full_name, passenger_type, birth_date)
            VALUES (@item, @name, @type, @birthDate)
            """);
        foreach (var passenger in passengers)
        {
            command.Parameters.Clear();
            command.Parameters.AddWithValue("@item", itemId);
            command.Parameters.AddWithValue("@name", passenger.FullName);
            command.Parameters.AddWithValue("@type", passenger.PassengerType);
            command.Parameters.AddWithValue("@birthDate", passenger.BirthDate);
            await command.ExecuteNonQueryAsync(ct);
        }
    }

    public async Task<LockedItem?> LockItemAsync(ulong bookingId, CancellationToken ct)
    {
        await using var command = Command("""
            SELECT b.id AS booking_id, i.id AS item_id, b.customer_id, b.selling_branch_id, i.service_type,
                i.status, td.tour_departure_id, i.quantity, i.price_snapshot, b.hold_expires_at, b.total,
                fd.flight_offer_id
            FROM bookings b
            JOIN booking_items i ON i.booking_id = b.id
            LEFT JOIN tour_booking_details td ON td.booking_item_id = i.id
            LEFT JOIN flight_booking_details fd ON fd.booking_item_id = i.id
            WHERE b.id = @id
            ORDER BY i.id LIMIT 1
            FOR UPDATE
            """);
        command.Parameters.AddWithValue("@id", bookingId);
        return await command.ReadSingleAsync(ReadLockedItem, ct);
    }

    /// <summary>Compare-and-set on the item status; false means another request changed it first.</summary>
    public async Task<bool> TransitionItemAsync(LockedItem item, string toStatus, string? confirmationCode,
        CancellationToken ct)
    {
        await using var command = Command("""
            UPDATE booking_items
            SET status = @to, supplier_confirmation_code = COALESCE(@code, supplier_confirmation_code)
            WHERE id = @item AND status = @from
            """);
        command.Parameters.AddWithValue("@to", toStatus);
        command.Parameters.AddWithValue("@code", confirmationCode);
        command.Parameters.AddWithValue("@item", item.ItemId);
        command.Parameters.AddWithValue("@from", item.Status);
        if (await command.ExecuteNonQueryAsync(ct) != 1) return false;

        command.Parameters.Clear();
        command.CommandText = "UPDATE bookings SET status = @status WHERE id = @booking";
        command.Parameters.AddWithValue("@status", BookingStatus.FromItemStatus(toStatus));
        command.Parameters.AddWithValue("@booking", item.BookingId);
        await command.ExecuteNonQueryAsync(ct);
        return true;
    }

    /// <summary>
    /// Records a succeeded simulated payment. Returns false when the idempotency key was already used, so a
    /// retried request never charges twice.
    /// </summary>
    public async Task<bool> TryInsertPaymentAsync(ulong bookingId, decimal amount, string idempotencyKey,
        DateTime nowUtc, CancellationToken ct)
    {
        await using var command = Command("""
            INSERT INTO payments (booking_id, provider, provider_transaction_id, idempotency_key, amount, currency,
                status, paid_at)
            VALUES (@booking, @provider, @transaction, @key, @amount, 'VND', @status, @now)
            """);
        command.Parameters.AddWithValue("@booking", bookingId);
        command.Parameters.AddWithValue("@provider", PaymentProvider.Simulated);
        var transactionId = PaymentProvider.SimulatedTransactionPrefix + Guid.NewGuid().ToString("N");
        command.Parameters.AddWithValue("@transaction", transactionId);
        command.Parameters.AddWithValue("@key", idempotencyKey);
        command.Parameters.AddWithValue("@amount", amount);
        command.Parameters.AddWithValue("@status", PaymentStatus.Succeeded);
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

    public async Task<bool> HasPaymentAsync(ulong bookingId, string idempotencyKey, CancellationToken ct)
    {
        await using var command = Command("""
            SELECT COUNT(*) FROM payments
            WHERE booking_id = @booking AND idempotency_key = @key AND status = @status
            """);
        command.Parameters.AddWithValue("@booking", bookingId);
        command.Parameters.AddWithValue("@key", idempotencyKey);
        command.Parameters.AddWithValue("@status", PaymentStatus.Succeeded);
        return Convert.ToInt64(await command.ExecuteScalarAsync(ct)) > 0;
    }

    /// <summary>
    /// Returns true when ANY payment row (any status) exists for this idempotency key.
    /// Used for VNPAY idempotency: a failed or refund_needed row also stops re-processing.
    /// </summary>
    public async Task<bool> HasPaymentByKeyAsync(string idempotencyKey, CancellationToken ct)
    {
        await using var command = Command(
            "SELECT COUNT(*) FROM payments WHERE idempotency_key = @key");
        command.Parameters.AddWithValue("@key", idempotencyKey);
        return Convert.ToInt64(await command.ExecuteScalarAsync(ct)) > 0;
    }

    /// <summary>
    /// Records a VNPAY payment result (succeeded, failed, or refund_needed).
    /// Returns false when idempotency_key already exists (concurrent or duplicate IPN).
    /// Requires migration 011 (gateway_meta column) to have been applied.
    /// </summary>
    public async Task<bool> TryInsertGatewayPaymentAsync(ulong bookingId, decimal amount,
        string idempotencyKey, string providerTransactionId, string status,
        IDictionary<string, string>? gatewayMeta, DateTime nowUtc, CancellationToken ct)
    {
        await using var command = Command("""
            INSERT INTO payments (booking_id, provider, provider_transaction_id, idempotency_key,
                amount, currency, gateway_meta, status, paid_at)
            VALUES (@booking, @provider, @txnNo, @key, @amount, 'VND', @meta, @status, @paidAt)
            """);
        command.Parameters.AddWithValue("@booking", bookingId);
        command.Parameters.AddWithValue("@provider", PaymentProvider.VnPay);
        command.Parameters.AddWithValue("@txnNo", providerTransactionId);
        command.Parameters.AddWithValue("@key", idempotencyKey);
        command.Parameters.AddWithValue("@amount", amount);
        command.Parameters.AddWithValue("@meta",
            gatewayMeta is null ? null : JsonSerializer.Serialize(gatewayMeta, GatewayMetaJson));
        command.Parameters.AddWithValue("@status", status);
        command.Parameters.AddWithValue("@paidAt",
            status == PaymentStatus.Succeeded ? nowUtc : (DateTime?)null);
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

    private static readonly JsonSerializerOptions GatewayMetaJson =
        new() { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };

    public Task CommitAsync(CancellationToken ct) => transaction.CommitAsync(ct);

    public async ValueTask DisposeAsync()
    {
        await transaction.DisposeAsync();
        await connection.DisposeAsync();
    }

    private async Task<ulong> InsertBookingRowAsync(NewBooking booking, string code, CancellationToken ct)
    {
        await using var command = Command("""
            INSERT INTO bookings (booking_code, customer_id, selling_branch_id, status, currency, subtotal,
                discount_total, total, hold_expires_at)
            VALUES (@code, @customer, @branch, @status, 'VND', @total, 0, @total, @holdExpiresAt)
            """);
        command.Parameters.AddWithValue("@code", code);
        command.Parameters.AddWithValue("@customer", booking.CustomerId);
        command.Parameters.AddWithValue("@branch", booking.SellingBranchId);
        command.Parameters.AddWithValue("@status", BookingStatus.Pending);
        command.Parameters.AddWithValue("@total", booking.Quote.Total);
        command.Parameters.AddWithValue("@holdExpiresAt", booking.HoldExpiresAt);
        await command.ExecuteNonQueryAsync(ct);
        return (ulong)command.LastInsertedId;
    }

    private MySqlCommand Command(string sql) => new(sql, connection, transaction);

    private static FlightQuoteRow ReadFlightQuote(MySqlDataReader r) => new(
        r.GetUInt64("flight_id"), r.GetUInt64("offer_id"), r.GetString("flight_number"), r.GetString("airline"),
        r.GetString("origin_code"), r.GetString("origin_city"), r.GetString("destination_code"),
        r.GetString("destination_city"), r.GetUtcDateTime("depart_at"), r.GetUtcDateTime("arrive_at"),
        r.GetString("cabin_class"), r.GetDecimal("quoted_price"), r.GetNullableString("terms"),
        r.GetNullableInt("remaining_seats"));

    private static LockedItem ReadLockedItem(MySqlDataReader r)
    {
        var snapshot = BookingSnapshotReader.Read(r.GetNullableString("price_snapshot"));
        return new LockedItem(r.GetUInt64("booking_id"), r.GetUInt64("item_id"), r.GetUInt64("customer_id"),
            r.IsDBNull(r.GetOrdinal("selling_branch_id")) ? null : r.GetUInt64("selling_branch_id"),
            r.GetString("service_type"), r.GetString("status"),
            r.IsDBNull(r.GetOrdinal("tour_departure_id")) ? null : r.GetUInt64("tour_departure_id"),
            r.GetInt32("quantity"), snapshot?.StartDate, snapshot?.EndDate,
            r.GetNullableUtcDateTime("hold_expires_at"), r.GetDecimal("total"),
            r.IsDBNull(r.GetOrdinal("flight_offer_id")) ? null : r.GetUInt64("flight_offer_id"));
    }
}

public static class BookingSnapshotReader
{
    public static BookingSnapshot? Read(string? json) => string.IsNullOrEmpty(json)
        ? null
        : JsonSerializer.Deserialize<BookingSnapshot>(json, BookingWriteSession.SnapshotJson);
}
