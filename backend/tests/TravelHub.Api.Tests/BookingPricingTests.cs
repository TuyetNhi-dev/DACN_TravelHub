using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Tests;

public sealed class BookingPricingTests
{
    [Fact]
    public void Tour_charges_adult_and_child_fares_separately()
    {
        var quote = BookingPricing.ForTour(adultPrice: 3_000_000m, childPrice: 2_250_000m, adults: 2, children: 1);

        Assert.Equal(8_250_000m, quote.Total);
        Assert.Equal(3, quote.Quantity);
        Assert.Collection(quote.Lines,
            adult => Assert.Equal(6_000_000m, adult.Amount),
            child => Assert.Equal(2_250_000m, child.Amount));
    }

    [Fact]
    public void Tour_without_child_fare_charges_children_the_adult_fare()
    {
        var quote = BookingPricing.ForTour(adultPrice: 1_000_000m, childPrice: null, adults: 1, children: 2);

        Assert.Equal(3_000_000m, quote.Total);
    }

    [Fact]
    public void Tour_with_only_adults_has_a_single_price_line()
    {
        var quote = BookingPricing.ForTour(1_500_000m, 1_000_000m, adults: 2, children: 0);

        Assert.Single(quote.Lines);
        Assert.Equal(3_000_000m, quote.Total);
    }

    [Fact]
    public void Hotel_total_is_nightly_price_times_nights_times_rooms()
    {
        var quote = BookingPricing.ForHotel(nightlyPrice: 850_000m, nights: 3, rooms: 2);

        Assert.Equal(5_100_000m, quote.Total);
        Assert.Equal(2, quote.Quantity);
    }

    [Fact]
    public void Flight_total_is_fare_times_passengers()
    {
        Assert.Equal(2_700_000m, BookingPricing.ForFlight(900_000m, 3).Total);
    }

    [Fact]
    public void Nights_counts_calendar_days_between_check_in_and_check_out()
    {
        Assert.Equal(2, BookingPricing.Nights(new DateOnly(2026, 12, 30), new DateOnly(2027, 1, 1)));
    }
}
