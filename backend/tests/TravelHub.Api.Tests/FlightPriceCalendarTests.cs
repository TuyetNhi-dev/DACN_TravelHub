using TravelHub.Api.Features.Flights;

namespace TravelHub.Api.Tests;

public sealed class FlightPriceCalendarTests
{
    private static readonly DateOnly Today = new(2026, 11, 17);

    [Theory]
    [InlineData("2026-12", true)]
    [InlineData(" 2027-01 ", true)]
    [InlineData("2026-13", false)]
    [InlineData("2026-1", false)]
    [InlineData("12-2026", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void Parses_only_year_month(string? raw, bool expected)
    {
        Assert.Equal(expected, FlightPriceCalendar.TryParseMonth(raw, out _));
    }

    [Fact]
    public void Parsed_month_starts_on_day_one()
    {
        Assert.True(FlightPriceCalendar.TryParseMonth("2027-02", out var first));
        Assert.Equal(new DateOnly(2027, 2, 1), first);
    }

    [Theory]
    [InlineData(2026, 10, false)]
    [InlineData(2026, 11, true)]
    [InlineData(2027, 10, true)]
    [InlineData(2027, 11, false)]
    public void Window_runs_from_this_month_to_eleven_months_ahead(int year, int month, bool expected)
    {
        Assert.Equal(expected, FlightPriceCalendar.IsWithinBookingWindow(new DateOnly(year, month, 1), Today));
    }

    [Fact]
    public void Builds_every_day_and_marks_all_tied_cheapest_days()
    {
        var first = new DateOnly(2026, 12, 1);
        var rows = new[]
        {
            new FlightDayLowest(first, 900_000m, 3),
            new FlightDayLowest(first.AddDays(2), 650_000m, 2),
            new FlightDayLowest(first.AddDays(4), 650_000m, 1),
        };

        var days = FlightPriceCalendar.BuildDays(first, first.AddDays(4), rows);

        Assert.Equal(5, days.Count);
        Assert.Null(days[1].LowestPrice);
        Assert.Equal(0, days[1].OfferCount);
        Assert.Equal([false, false, true, false, true], days.Select(day => day.IsCheapest));
    }

    [Fact]
    public void Empty_month_has_no_cheapest_day()
    {
        var first = new DateOnly(2026, 12, 1);
        var days = FlightPriceCalendar.BuildDays(first, first.AddDays(30), []);
        Assert.Equal(31, days.Count);
        Assert.DoesNotContain(days, day => day.IsCheapest);
    }
}
