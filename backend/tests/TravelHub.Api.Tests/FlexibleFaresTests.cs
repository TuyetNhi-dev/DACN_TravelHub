using TravelHub.Api.Features.Flights;

namespace TravelHub.Api.Tests;

public sealed class FlexibleFaresTests
{
    private static readonly DateOnly Today = new(2026, 11, 17);

    [Fact]
    public void Window_is_centred_on_the_requested_day()
    {
        var (first, last) = FlexibleFares.Window(new DateOnly(2026, 12, 10), Today);
        Assert.Equal(new DateOnly(2026, 12, 7), first);
        Assert.Equal(new DateOnly(2026, 12, 13), last);
    }

    [Fact]
    public void Window_never_starts_before_the_earliest_day_and_keeps_seven_days()
    {
        var (first, last) = FlexibleFares.Window(Today.AddDays(1), Today);
        Assert.Equal(Today, first);
        Assert.Equal(Today.AddDays(6), last);
    }

    [Fact]
    public void Round_trips_skip_returns_before_departure_and_mark_tied_cheapest_pairs()
    {
        var day = new DateOnly(2026, 12, 10);
        var outbound = new[] { Day(day, 1_000_000m), Day(day.AddDays(1), 800_000m) };
        var inbound = new[] { Day(day, 900_000m), Day(day.AddDays(1), 700_000m), Day(day.AddDays(2), null) };

        var pairs = FlexibleFares.Combine(outbound, inbound);

        // 10→10, 10→11, 10→12, 11→11, 11→12: the 11→10 pair is impossible.
        Assert.Equal(5, pairs.Count);
        Assert.DoesNotContain(pairs, pair => pair.ReturnDate < pair.DepartDate);
        Assert.Null(pairs.Single(pair => pair.DepartDate == day && pair.ReturnDate == day.AddDays(2)).Total);
        var cheapest = pairs.Where(pair => pair.IsCheapest).ToList();
        Assert.Single(cheapest);
        Assert.Equal(1_500_000m, cheapest[0].Total);
        Assert.Equal(day.AddDays(1), cheapest[0].DepartDate);
    }

    [Fact]
    public void Pairs_without_any_quote_have_no_cheapest()
    {
        var day = new DateOnly(2026, 12, 10);
        var pairs = FlexibleFares.Combine([Day(day, null)], [Day(day, 500_000m)]);
        Assert.Null(pairs.Single().Total);
        Assert.False(pairs.Single().IsCheapest);
    }

    private static FlightDayPriceDto Day(DateOnly date, decimal? price) =>
        new(date, price, price is null ? 0 : 1, false);
}
