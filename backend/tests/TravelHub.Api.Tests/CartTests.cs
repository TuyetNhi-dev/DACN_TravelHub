using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Configuration;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Cart;

namespace TravelHub.Api.Tests;

public sealed class CartRulesTests
{
    private static readonly DateOnly Today = new(2026, 11, 21);
    private static readonly DateTime Now = new(2026, 11, 21, 3, 0, 0, DateTimeKind.Utc);

    private static CartDepartureRow Departure(int reserved = 10, string status = "open", int daysAhead = 10,
        decimal adult = 4_590_000m, decimal? child = 3_290_000m, string tourStatus = "published") =>
        new("100", "1", "TOUR001", "Đà Nẵng", tourStatus, "Đà Nẵng", null, null, "TP. Hồ Chí Minh",
            Today.AddDays(daysAhead), Today.AddDays(daysAhead + 3), 20, reserved, adult, child, status);

    private static CartChoice Choice(int adults = 2, int children = 1) => new(100, adults, children);

    private static string Status(CartDepartureRow departure, CartChoice? choice = null,
        decimal adultSeen = 4_590_000m, decimal? childSeen = 3_290_000m) =>
        CartRules.Status(departure, choice ?? Choice(), adultSeen, childSeen, Today);

    [Fact]
    public void A_bookable_departure_at_the_price_seen_is_ok()
    {
        Assert.Equal(CartItemStatus.Ok, Status(Departure()));
    }

    [Fact]
    public void Closed_past_leaving_today_or_unpublished_departures_are_unavailable()
    {
        Assert.Equal(CartItemStatus.Unavailable, Status(Departure(status: "closed")));
        Assert.Equal(CartItemStatus.Unavailable, Status(Departure(daysAhead: 0)));
        Assert.Equal(CartItemStatus.Unavailable, Status(Departure(daysAhead: -3)));
        Assert.Equal(CartItemStatus.Unavailable, Status(Departure(tourStatus: "paused")));
    }

    [Fact]
    public void Seats_are_checked_against_the_whole_group()
    {
        Assert.Equal(CartItemStatus.SoldOut, Status(Departure(reserved: 20)));
        Assert.Equal(CartItemStatus.NotEnoughSeats, Status(Departure(reserved: 18)));
        Assert.Equal(CartItemStatus.Ok, Status(Departure(reserved: 17)));
    }

    [Fact]
    public void A_different_adult_price_or_child_price_is_reported_as_a_price_change()
    {
        Assert.Equal(CartItemStatus.PriceChanged, Status(Departure(adult: 4_790_000m)));
        Assert.Equal(CartItemStatus.PriceChanged, Status(Departure(child: 2_990_000m)));
        // The child fare does not matter when no child travels.
        Assert.Equal(CartItemStatus.Ok, Status(Departure(child: 2_990_000m), Choice(children: 0)));
    }

    [Fact]
    public void Without_a_child_fare_children_are_compared_and_priced_at_the_adult_fare()
    {
        Assert.Equal(CartItemStatus.Ok, Status(Departure(child: null), childSeen: null));
        Assert.Equal(3 * 4_590_000m, CartRules.Subtotal(Departure(child: null), Choice()));
        Assert.Equal(2 * 4_590_000m + 3_290_000m, CartRules.Subtotal(Departure(), Choice()));
    }

    [Theory]
    [InlineData(null, 2, 0, "departureId")]
    [InlineData("abc", 2, 0, "departureId")]
    [InlineData("100", 0, 1, "adultCount")]
    [InlineData("100", 2, -1, "childCount")]
    [InlineData("100", 15, 6, "adultCount")]
    public void Invalid_choices_are_rejected_with_the_field_name(string? departureId, int adults, int children,
        string field)
    {
        var error = Assert.Throws<ApiValidationException>(() => CartRules.Validate(departureId, adults, children));
        Assert.Contains(field, error.Errors.Keys);
    }

    [Fact]
    public void Guest_lines_skip_broken_entries_keep_the_newest_duplicate_and_clamp_future_times()
    {
        var lines = CartRules.GuestLines(new GuestCartRequest([
            new GuestCartItem("100", 2, 0, 1m, null, Now.AddHours(-2)),
            new GuestCartItem("100", 3, 0, 1m, null, Now.AddHours(-1)),
            new GuestCartItem("x", 2, 0, null, null, Now),
            new GuestCartItem("200", 0, 0, null, null, Now),
            new GuestCartItem("300", 1, 0, -5m, null, Now.AddDays(3)),
        ]), Now);

        Assert.Equal([300UL, 100UL], lines.Select(line => line.Choice.DepartureId));
        Assert.Equal(3, lines.Single(line => line.Choice.DepartureId == 100).Choice.AdultCount);
        Assert.Equal(Now, lines[0].UpdatedAt);
        Assert.Null(lines[0].AdultPriceSeen);
    }

    [Fact]
    public void A_guest_list_far_longer_than_a_cart_is_refused()
    {
        var items = Enumerable.Range(1, CartLimits.MaxGuestItems + 1)
            .Select(id => new GuestCartItem(id.ToString(), 1, 0, null, null, Now)).ToList();

        Assert.Throws<ApiException>(() => CartRules.GuestLines(new GuestCartRequest(items), Now));
    }

    private static CartItemRow AccountRow(ulong departure, DateTime updated) =>
        new(departure.ToString(), departure, 1, 0, 1m, null, updated);

    private static GuestLine Guest(ulong departure, DateTime updated) =>
        new(new CartChoice(departure, 2, 0), null, null, updated);

    [Fact]
    public void Merge_keeps_the_newer_version_of_a_departure_already_in_the_account()
    {
        var account = new[] { AccountRow(1, Now.AddHours(-1)), AccountRow(2, Now) };
        var plan = CartRules.PlanMerge(account, [Guest(1, Now), Guest(2, Now.AddHours(-5))]);

        Assert.Equal([1UL], plan.ToSave.Select(line => line.Choice.DepartureId));
        Assert.Equal(0, plan.NotMoved);
    }

    [Fact]
    public void Merge_fills_free_places_newest_first_and_never_drops_account_lines()
    {
        var account = Enumerable.Range(1, CartLimits.MaxItems - 2)
            .Select(id => AccountRow((ulong)id, Now.AddDays(-1))).ToList();
        var guest = new[] { Guest(101, Now.AddMinutes(-30)), Guest(102, Now), Guest(103, Now.AddMinutes(-10)),
            Guest(3, Now) };

        var plan = CartRules.PlanMerge(account, guest);

        // Departure 3 is an update (no new place); 102 and 103 are the two newest new lines; 101 does not fit.
        Assert.Equal([102UL, 3UL, 103UL], plan.ToSave.Select(line => line.Choice.DepartureId));
        Assert.Equal(1, plan.NotMoved);
    }
}

public sealed class CartServiceTests
{
    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    // No database is configured, so any query throws DatabaseConfigurationException: a test can tell whether a
    // code path reached the database at all.
    private static CartService WithoutDatabase() => new(
        new CartRepository(new MySqlConnectionFactory(Options.Create(new DatabaseOptions()))),
        new VietnamClock(new FixedTime(new DateTimeOffset(2026, 11, 21, 3, 0, 0, TimeSpan.Zero))));

    [Fact]
    public async Task Invalid_input_is_refused_before_any_query()
    {
        var service = WithoutDatabase();

        await Assert.ThrowsAsync<ApiValidationException>(
            () => service.SaveAsync(7, new SaveCartItemRequest("1 OR 1=1", 2, 0), CancellationToken.None));
        await Assert.ThrowsAsync<ApiValidationException>(() => service.DeleteAsync(7, "-1", CancellationToken.None));
        // A valid request does go to the (unconfigured) database.
        await Assert.ThrowsAsync<DatabaseConfigurationException>(
            () => service.SaveAsync(7, new SaveCartItemRequest("12", 2, 0), CancellationToken.None));
    }

    [Fact]
    public async Task An_empty_or_entirely_broken_guest_cart_is_answered_without_the_database()
    {
        var cart = await WithoutDatabase().QuoteAsync(new GuestCartRequest([
            new GuestCartItem("x", 1, 0, null, null, null)]), CancellationToken.None);

        Assert.Empty(cart.Items);
        Assert.Equal(0m, cart.EstimatedTotal);
        Assert.Equal(CartLimits.MaxItems, cart.MaxItems);
    }

    [Fact]
    public async Task A_huge_guest_list_is_a_bad_request()
    {
        var items = Enumerable.Range(1, 60).Select(id => new GuestCartItem(id.ToString(), 1, 0, null, null, null))
            .ToList();

        var error = await Assert.ThrowsAsync<ApiException>(
            () => WithoutDatabase().QuoteAsync(new GuestCartRequest(items), CancellationToken.None));
        Assert.Equal(StatusCodes.Status400BadRequest, error.StatusCode);
    }
}
