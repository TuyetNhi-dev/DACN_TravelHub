using System.Text.RegularExpressions;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Bookings;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Tests;

public sealed partial class CatalogRulesTests
{
    private static readonly DateOnly Today = new(2026, 11, 16);

    private static TourDepartureRow Departure(string status = DepartureStatus.Open, int daysAhead = 5,
        int reserved = 10) =>
        new("1", "TP. Hồ Chí Minh", Today.AddDays(daysAhead), Today.AddDays(daysAhead + 2), 20, reserved,
            1_000_000m, null, status);

    [Fact]
    public void Open_future_departure_with_free_seats_is_bookable()
    {
        Assert.True(TourService.IsBookable(Departure(), Today));
    }

    [Fact]
    public void Departures_that_are_full_closed_or_leaving_today_are_not_bookable()
    {
        Assert.False(TourService.IsBookable(Departure(reserved: 20), Today));
        Assert.False(TourService.IsBookable(Departure(status: DepartureStatus.Closed), Today));
        Assert.False(TourService.IsBookable(Departure(daysAhead: 0), Today));
    }

    [Fact]
    public void Vietnam_day_starts_at_17_00_utc_on_the_previous_day()
    {
        var start = VietnamClock.StartOfDayUtc(new DateOnly(2026, 11, 20));

        Assert.Equal(new DateTime(2026, 11, 19, 17, 0, 0, DateTimeKind.Utc), start);
        Assert.Equal(new DateOnly(2026, 11, 20), VietnamClock.ToVietnamDate(start));
    }

    [Fact]
    public void Booking_codes_are_dated_and_unambiguous()
    {
        var code = BookingCodeGenerator.Create(Today);

        Assert.Matches(BookingCodePattern(), code);
    }

    [GeneratedRegex("^SH261116[A-HJ-NP-Z2-9]{6}$")]
    private static partial Regex BookingCodePattern();
}
