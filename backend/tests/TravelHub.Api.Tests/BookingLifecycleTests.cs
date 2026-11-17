using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Tests;

public sealed class BookingLifecycleTests
{
    private static readonly DateOnly Today = new(2026, 11, 16);
    private static readonly DateTime Now = new(2026, 11, 16, 3, 0, 0, DateTimeKind.Utc);

    [Theory]
    [InlineData(BookingItemStatus.Pending, true)]
    [InlineData(BookingItemStatus.AwaitingSupplier, true)]
    [InlineData(BookingItemStatus.AwaitingPayment, true)]
    [InlineData(BookingItemStatus.Confirmed, false)]
    [InlineData(BookingItemStatus.Cancelled, false)]
    public void Customer_can_cancel_only_unpaid_orders(string status, bool expected)
    {
        Assert.Equal(expected, BookingLifecycle.CustomerCanCancel(status, Today.AddDays(5), Today));
    }

    [Fact]
    public void Customer_cannot_cancel_on_or_after_the_service_date()
    {
        Assert.False(BookingLifecycle.CustomerCanCancel(BookingItemStatus.Pending, Today, Today));
    }

    [Theory]
    [InlineData(ServiceType.Tour, null, true)]
    [InlineData(ServiceType.Flight, "2026-11-16T03:10:00Z", true)]
    [InlineData(ServiceType.Flight, null, false)]
    [InlineData(ServiceType.Hotel, null, false)]
    public void Tours_and_flight_deals_hold_seats_partner_quotes_do_not(string serviceType, string? holdUntil,
        bool expected)
    {
        DateTime? deadline = holdUntil is null ? null : DateTime.Parse(holdUntil).ToUniversalTime();
        Assert.Equal(expected, BookingLifecycle.HoldsSeats(serviceType, deadline));
    }

    [Theory]
    [InlineData(true, BookingItemStatus.Pending, false)]
    [InlineData(false, BookingItemStatus.AwaitingSupplier, true)]
    [InlineData(false, BookingItemStatus.AwaitingPayment, false)]
    public void Staff_confirm_partner_quotes_only_never_seat_holds(bool holdsSeats, string status, bool expected)
    {
        Assert.Equal(expected, BookingLifecycle.StaffCanConfirm(holdsSeats, status));
    }

    [Theory]
    [InlineData(true, BookingItemStatus.Pending, BookingItemStatus.Cancelled)]
    [InlineData(false, BookingItemStatus.AwaitingSupplier, BookingItemStatus.Failed)]
    public void Operators_reject_from_the_initial_status_to_the_matching_closed_status(
        bool holdsSeats, string rejectable, string rejected)
    {
        Assert.Equal(rejectable, BookingLifecycle.RejectableStatus(holdsSeats));
        Assert.Equal(rejected, BookingLifecycle.RejectedStatus(holdsSeats));
        Assert.Equal(rejectable, BookingItemStatus.InitialFor(holdsSeats));
    }

    [Fact]
    public void A_seat_hold_can_be_paid_only_while_it_is_running()
    {
        Assert.True(BookingLifecycle.CanPay(true, BookingItemStatus.Pending, Now.AddSeconds(1), Now));
        Assert.False(BookingLifecycle.CanPay(true, BookingItemStatus.Pending, Now, Now));
        Assert.False(BookingLifecycle.CanPay(true, BookingItemStatus.Pending, Now.AddMinutes(-1), Now));
        Assert.False(BookingLifecycle.CanPay(true, BookingItemStatus.Confirmed, Now.AddMinutes(5), Now));
    }

    [Fact]
    public void Partner_quotes_are_paid_only_after_the_partner_confirmed()
    {
        Assert.False(BookingLifecycle.CanPay(false, BookingItemStatus.AwaitingSupplier, null, Now));
        Assert.True(BookingLifecycle.CanPay(false, BookingItemStatus.AwaitingPayment, null, Now));
        Assert.False(BookingLifecycle.CanPay(false, BookingItemStatus.Confirmed, null, Now));
    }

    [Fact]
    public void Only_seat_holds_past_their_deadline_count_as_expired()
    {
        Assert.True(BookingLifecycle.IsHoldExpired(true, BookingItemStatus.Pending, Now, Now));
        Assert.False(BookingLifecycle.IsHoldExpired(true, BookingItemStatus.Pending, Now.AddTicks(1), Now));
        Assert.False(BookingLifecycle.IsHoldExpired(true, BookingItemStatus.Confirmed, Now, Now));
        Assert.False(BookingLifecycle.IsHoldExpired(true, BookingItemStatus.Pending, null, Now));
        Assert.False(BookingLifecycle.IsHoldExpired(false, BookingItemStatus.Pending, Now, Now));
    }

    [Fact]
    public void A_flight_deal_order_holds_seats_while_an_ordinary_flight_order_does_not()
    {
        var deal = Item(BookingItemStatus.Pending, Today.AddDays(5), null) with
        {
            ServiceType = ServiceType.Flight, DepartureId = null, FlightOfferId = 42,
            HoldExpiresAt = Now.AddMinutes(10),
        };
        var ordinary = deal with { HoldExpiresAt = null, Status = BookingItemStatus.AwaitingSupplier };
        Assert.True(deal.HoldsSeats);
        Assert.False(ordinary.HoldsSeats);
    }

    [Fact]
    public void Holds_default_to_ten_minutes_and_ignore_invalid_settings()
    {
        Assert.Equal(TimeSpan.FromMinutes(10), new BookingOptions().TourHold);
        Assert.Equal(TimeSpan.FromMinutes(10), new BookingOptions { TourHoldMinutes = 0 }.TourHold);
        Assert.Equal(TimeSpan.FromMinutes(15), new BookingOptions { TourHoldMinutes = 15 }.TourHold);
        Assert.Equal(TimeSpan.FromMinutes(10), new BookingOptions().DealHold);
        Assert.Equal(TimeSpan.FromMinutes(10), new BookingOptions { DealHoldMinutes = -1 }.DealHold);
        var options = new BookingOptions { DealHoldMinutes = 5, TourHoldMinutes = 20 };
        Assert.Equal(TimeSpan.FromMinutes(5), options.DealHold);
        Assert.Equal(TimeSpan.FromSeconds(30), new BookingOptions { HoldSweepSeconds = -5 }.HoldSweep);
    }

    [Fact]
    public void Only_confirmed_orders_whose_service_has_ended_can_be_completed()
    {
        var finished = Item(BookingItemStatus.Confirmed, Today.AddDays(-3), Today.AddDays(-1));
        var upcoming = finished with { EndDate = Today };
        var unconfirmed = finished with { Status = BookingItemStatus.Pending };

        Assert.True(BookingLifecycle.CanComplete(finished, Today));
        Assert.False(BookingLifecycle.CanComplete(upcoming, Today));
        Assert.False(BookingLifecycle.CanComplete(unconfirmed, Today));
    }

    [Theory]
    [InlineData(BookingItemStatus.Pending, BookingStatus.Pending)]
    [InlineData(BookingItemStatus.AwaitingSupplier, BookingStatus.Pending)]
    [InlineData(BookingItemStatus.AwaitingPayment, BookingStatus.Pending)]
    [InlineData(BookingItemStatus.Confirmed, BookingStatus.Confirmed)]
    [InlineData(BookingItemStatus.Failed, BookingStatus.Cancelled)]
    [InlineData(BookingItemStatus.Completed, BookingStatus.Completed)]
    public void Order_status_mirrors_its_single_item(string itemStatus, string expected)
    {
        Assert.Equal(expected, BookingStatus.FromItemStatus(itemStatus));
    }

    private static LockedItem Item(string status, DateOnly start, DateOnly? end) =>
        new(1, 1, 1, null, ServiceType.Tour, status, 1, 2, start, end);
}
