using TravelHub.Api.Common.Time;

namespace TravelHub.Api.Features.Bookings;

/// <summary>Builds the customer-facing description frozen into each order.</summary>
public static class BookingSnapshots
{
    private const string TourTerms =
        "Chỗ được giữ cho đơn này. Nhân viên SàiHành sẽ liên hệ để xác nhận và hướng dẫn thanh toán.";
    private const string SupplierTerms =
        "Giá hợp đồng với đối tác. Đơn chưa được xác nhận: SàiHành sẽ báo lại khi đối tác xác nhận còn chỗ.";

    private static readonly Dictionary<string, string> CabinLabels = new()
    {
        ["economy"] = "Phổ thông",
        ["premium_economy"] = "Phổ thông đặc biệt",
        ["business"] = "Thương gia",
        ["first"] = "Hạng nhất",
    };

    public static BookingSnapshot Tour(TourPricingRow tour, PriceQuote quote) => new(
        tour.TourTitle,
        $"{tour.TourCode} · Khởi hành từ {tour.DepartureFrom}",
        tour.DepartureDate,
        tour.ReturnDate,
        quote.Lines,
        TourTerms);

    public static BookingSnapshot Hotel(HotelQuoteRow hotel, ValidHotelRequest request, PriceQuote quote) => new(
        hotel.HotelName,
        $"{hotel.RoomTypeName} · {hotel.City} · {request.Guests} khách",
        request.CheckIn,
        request.CheckOut,
        quote.Lines,
        JoinTerms(hotel.Terms));

    public static BookingSnapshot Flight(FlightQuoteRow flight, PriceQuote quote) => new(
        $"{flight.OriginCity} ({flight.OriginCode}) → {flight.DestinationCity} ({flight.DestinationCode})",
        $"{flight.Airline} {flight.FlightNumber} · {CabinLabels.GetValueOrDefault(flight.CabinClass, flight.CabinClass)}",
        VietnamClock.ToVietnamDate(flight.DepartAt),
        null,
        quote.Lines,
        JoinTerms(flight.Terms));

    private static string JoinTerms(string? partnerTerms) =>
        string.IsNullOrWhiteSpace(partnerTerms) ? SupplierTerms : SupplierTerms + " " + partnerTerms.Trim();
}
