namespace TravelHub.Api.Features.Bookings;

public sealed record DepartureState(string Status, DateOnly DepartureDate, int Capacity, int ReservedSeats);

public sealed record TourPricingRow(string TourTitle, string TourCode, ulong OperatingBranchId,
    string DepartureFrom, DateOnly DepartureDate, DateOnly ReturnDate, decimal AdultPrice, decimal? ChildPrice);

public sealed record HotelQuoteRow(string RoomTypeName, string HotelName, string City, int MaxGuests,
    ulong? OfferId, decimal? NightlyPrice, string? Terms);

public sealed record FlightQuoteRow(ulong FlightId, ulong OfferId, string FlightNumber, string Airline,
    string OriginCode, string OriginCity, string DestinationCode, string DestinationCity,
    DateTime DepartAt, DateTime ArriveAt, string CabinClass, decimal Price, string? Terms);

public sealed record NewBooking(ulong CustomerId, ulong? SellingBranchId, string ServiceType, PriceQuote Quote,
    BookingSnapshot Snapshot);

/// <summary>Item locked FOR UPDATE while its status changes, so two operators cannot act on it at once.</summary>
public sealed record LockedItem(ulong BookingId, ulong ItemId, ulong CustomerId, ulong? SellingBranchId,
    string ServiceType, string Status, ulong? DepartureId, int Seats, DateOnly? StartDate, DateOnly? EndDate);
