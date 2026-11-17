using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Tests;

public sealed class BookingLifecycleTests
{
    private static readonly DateOnly Today = new(2026, 11, 16);

    [Theory]
    [InlineData(BookingItemStatus.Pending, true)]
    [InlineData(BookingItemStatus.AwaitingSupplier, true)]
    [InlineData(BookingItemStatus.Confirmed, false)]
    [InlineData(BookingItemStatus.Cancelled, false)]
    public void Customer_can_cancel_only_unconfirmed_orders(string status, bool expected)
    {
        Assert.Equal(expected, BookingLifecycle.CustomerCanCancel(status, Today.AddDays(5), Today));
    }

    [Fact]
    public void Customer_cannot_cancel_on_or_after_the_service_date()
    {
        Assert.False(BookingLifecycle.CustomerCanCancel(BookingItemStatus.Pending, Today, Today));
    }

    [Theory]
    [InlineData(ServiceType.Tour, BookingItemStatus.Pending, BookingItemStatus.Cancelled)]
    [InlineData(ServiceType.Hotel, BookingItemStatus.AwaitingSupplier, BookingItemStatus.Failed)]
    [InlineData(ServiceType.Flight, BookingItemStatus.AwaitingSupplier, BookingItemStatus.Failed)]
    public void Operators_confirm_from_the_initial_status_and_reject_to_the_matching_closed_status(
        string serviceType, string confirmable, string rejected)
    {
        Assert.Equal(confirmable, BookingLifecycle.ConfirmableStatus(serviceType));
        Assert.Equal(rejected, BookingLifecycle.RejectedStatus(serviceType));
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
