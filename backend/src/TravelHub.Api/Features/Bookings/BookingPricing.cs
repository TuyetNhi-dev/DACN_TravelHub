namespace TravelHub.Api.Features.Bookings;

public sealed record PriceQuote(IReadOnlyList<PriceLineDto> Lines, decimal Total, int Quantity, decimal UnitPrice);

/// <summary>Server-side price calculation. Totals sent by the browser are never trusted.</summary>
public static class BookingPricing
{
    public static PriceQuote ForTour(decimal adultPrice, decimal? childPrice, int adults, int children)
    {
        var lines = new List<PriceLineDto> { Line("Người lớn", adults, adultPrice) };
        // Without a child fare on the departure, children pay the adult fare rather than an invented discount.
        if (children > 0) lines.Add(Line("Trẻ em", children, childPrice ?? adultPrice));
        return new PriceQuote(lines, lines.Sum(line => line.Amount), adults + children, adultPrice);
    }

    public static PriceQuote ForHotel(decimal nightlyPrice, int nights, int rooms)
    {
        var line = new PriceLineDto($"{rooms} phòng × {nights} đêm", nights * rooms, nightlyPrice,
            nightlyPrice * nights * rooms);
        return new PriceQuote([line], line.Amount, rooms, nightlyPrice);
    }

    public static PriceQuote ForFlight(decimal farePrice, int passengers)
    {
        var line = Line("Hành khách", passengers, farePrice);
        return new PriceQuote([line], line.Amount, passengers, farePrice);
    }

    public static int Nights(DateOnly checkIn, DateOnly checkOut) => checkOut.DayNumber - checkIn.DayNumber;

    private static PriceLineDto Line(string label, int quantity, decimal unitPrice) =>
        new(label, quantity, unitPrice, unitPrice * quantity);
}
