using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Common.Time;

namespace TravelHub.Api.Features.Bookings;

/// <summary>Customer-side ordering. Tours hold real seats; hotels and flights only request a partner quote.</summary>
public sealed class BookingService(BookingRepository repository, VietnamClock clock, ILogger<BookingService> logger)
{
    public async Task<BookingDetailDto> CreateTourAsync(ulong customerId, CreateTourBookingRequest request,
        CancellationToken ct)
    {
        var tour = BookingRequestValidator.Tour(request);
        var today = clock.Today;
        ulong bookingId;
        await using (var session = await repository.BeginWriteAsync(ct))
        {
            var seats = tour.Adults + tour.Children;
            if (!await session.TryReserveSeatsAsync(tour.DepartureId, seats, today, ct))
                throw await ExplainReservationFailureAsync(session, tour.DepartureId, seats, today, ct);
            var pricing = await session.GetTourPricingAsync(tour.DepartureId, ct);
            var quote = BookingPricing.ForTour(pricing.AdultPrice, pricing.ChildPrice, tour.Adults, tour.Children);
            var booking = new NewBooking(customerId, pricing.OperatingBranchId, ServiceType.Tour, quote,
                BookingSnapshots.Tour(pricing, quote));
            bookingId = await session.InsertBookingAsync(booking, today, ct);
            var itemId = await session.InsertItemAsync(bookingId, booking, ct);
            await session.InsertTourDetailAsync(itemId, tour, ct);
            await session.InsertPassengersAsync(itemId, tour.Passengers, ct);
            await session.CommitAsync(ct);
        }
        logger.LogInformation("Tour booking {BookingId} created, departure {DepartureId}", bookingId, tour.DepartureId);
        return await GetForCustomerAsync(customerId, bookingId, ct);
    }

    public async Task<BookingDetailDto> CreateHotelAsync(ulong customerId, CreateHotelBookingRequest request,
        CancellationToken ct)
    {
        var today = clock.Today;
        var hotel = BookingRequestValidator.Hotel(request, today);
        ulong bookingId;
        await using (var session = await repository.BeginWriteAsync(ct))
        {
            var quoteRow = await session.FindHotelQuoteAsync(hotel.RoomTypeId, hotel.CheckIn,
                    hotel.CheckOut.AddDays(-1), ct)
                ?? throw ApiException.NotFound("Loại phòng không tồn tại hoặc khách sạn đã ngừng hợp tác.");
            if (hotel.Guests > quoteRow.MaxGuests * hotel.Rooms)
                throw ApiException.BadRequest($"Mỗi phòng tối đa {quoteRow.MaxGuests} khách. Vui lòng thêm phòng.");
            if (quoteRow is not { OfferId: { } offerId, NightlyPrice: { } nightly })
                throw ApiException.Conflict("Đối tác chưa có giá cho toàn bộ khoảng ngày này. Vui lòng chọn ngày khác.");
            var quote = BookingPricing.ForHotel(nightly, BookingPricing.Nights(hotel.CheckIn, hotel.CheckOut),
                hotel.Rooms);
            var booking = new NewBooking(customerId, null, ServiceType.Hotel, quote,
                BookingSnapshots.Hotel(quoteRow, hotel, quote));
            bookingId = await session.InsertBookingAsync(booking, today, ct);
            var itemId = await session.InsertItemAsync(bookingId, booking, ct);
            await session.InsertHotelDetailAsync(itemId, hotel, offerId, ct);
            await session.InsertPassengersAsync(itemId,
                [new ValidPassenger(hotel.LeadGuestName, PassengerType.Adult, null)], ct);
            await session.CommitAsync(ct);
        }
        logger.LogInformation("Hotel booking {BookingId} sent to partner, room type {RoomTypeId}",
            bookingId, hotel.RoomTypeId);
        return await GetForCustomerAsync(customerId, bookingId, ct);
    }

    public async Task<BookingDetailDto> CreateFlightAsync(ulong customerId, CreateFlightBookingRequest request,
        CancellationToken ct)
    {
        var flight = BookingRequestValidator.Flight(request);
        ulong bookingId;
        await using (var session = await repository.BeginWriteAsync(ct))
        {
            var quoteRow = await session.FindSellableFlightQuoteAsync(flight.OfferId, clock.UtcNow, ct)
                ?? throw ApiException.Conflict("Báo giá chuyến bay đã hết hạn hoặc không còn bán. Vui lòng tìm lại.");
            var quote = BookingPricing.ForFlight(quoteRow.Price, flight.Passengers.Count);
            var booking = new NewBooking(customerId, null, ServiceType.Flight, quote,
                BookingSnapshots.Flight(quoteRow, quote));
            bookingId = await session.InsertBookingAsync(booking, clock.Today, ct);
            var itemId = await session.InsertItemAsync(bookingId, booking, ct);
            await session.InsertFlightDetailAsync(itemId, quoteRow, ct);
            await session.InsertPassengersAsync(itemId, flight.Passengers, ct);
            await session.CommitAsync(ct);
        }
        logger.LogInformation("Flight booking {BookingId} sent to partner, offer {OfferId}", bookingId, flight.OfferId);
        return await GetForCustomerAsync(customerId, bookingId, ct);
    }

    public Task<IReadOnlyList<BookingSummaryDto>> ListForCustomerAsync(ulong customerId, CancellationToken ct) =>
        repository.ListForCustomerAsync(customerId, ct);

    public Task<BookingDetailDto> GetForCustomerAsync(ulong customerId, string rawId, CancellationToken ct) =>
        GetForCustomerAsync(customerId, ResourceId.Parse(rawId, "id"), ct);

    public async Task<BookingDetailDto> CancelForCustomerAsync(ulong customerId, string rawId, CancellationToken ct)
    {
        var bookingId = ResourceId.Parse(rawId, "id");
        await using (var session = await repository.BeginWriteAsync(ct))
        {
            var item = await session.LockItemAsync(bookingId, ct);
            // Someone else's order is reported as missing so order ids cannot be probed.
            if (item is null || item.CustomerId != customerId) throw NotFound();
            if (!BookingLifecycle.CustomerCanCancel(item.Status, item.StartDate, clock.Today))
                throw ApiException.Conflict("Đơn đã được xác nhận. Vui lòng liên hệ tổng đài để được hỗ trợ hủy.");
            await BookingLifecycle.CloseAsync(session, item, BookingItemStatus.Cancelled, ct);
            await session.CommitAsync(ct);
        }
        logger.LogInformation("Booking {BookingId} cancelled by customer", bookingId);
        return await GetForCustomerAsync(customerId, bookingId, ct);
    }

    private async Task<BookingDetailDto> GetForCustomerAsync(ulong customerId, ulong bookingId, CancellationToken ct)
    {
        var row = await repository.FindDetailAsync(bookingId, ct);
        if (row is null || row.CustomerId != customerId) throw NotFound();
        var canCancel = BookingLifecycle.CustomerCanCancel(row.Summary.ItemStatus, row.Summary.StartDate, clock.Today);
        return BookingMapper.ToDetail(row, canCancel, includeCustomer: false);
    }

    private static async Task<ApiException> ExplainReservationFailureAsync(BookingWriteSession session,
        ulong departureId, int seats, DateOnly today, CancellationToken ct)
    {
        var state = await session.FindDepartureStateAsync(departureId, ct);
        if (state is null) return ApiException.NotFound("Lịch khởi hành không tồn tại.");
        if (state.Status != Tours.DepartureStatus.Open || state.DepartureDate <= today)
            return ApiException.Conflict("Lịch khởi hành này đã đóng nhận khách.");
        var left = Math.Max(0, state.Capacity - state.ReservedSeats);
        return ApiException.Conflict(left == 0
            ? "Lịch khởi hành đã hết chỗ."
            : $"Lịch khởi hành chỉ còn {left} chỗ, không đủ cho {seats} khách.");
    }

    private static ApiException NotFound() => ApiException.NotFound("Không tìm thấy đơn đặt chỗ.");
}
