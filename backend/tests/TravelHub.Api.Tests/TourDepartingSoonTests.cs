using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Tests;

/// <summary>Seats and day count on GET /api/tours/departures/upcoming (home "Sắp khởi hành").</summary>
public sealed class TourDepartingSoonTests
{
    private static readonly DateOnly Today = new(2026, 11, 23);

    private static UpcomingDepartureRow Row(DateOnly date, int capacity = 30, int reserved = 0) => new(
        "11", "5", "T-005", "Hạ Long 2N1Đ", "Hạ Long", "Hà Nội", date, 2, 1, capacity, reserved, 2_490_000m);

    [Fact]
    public void Days_until_departure_count_calendar_days_from_today()
    {
        Assert.Equal(1, TourService.ToUpcoming(Row(Today.AddDays(1)), Today).DaysUntilDeparture);
        Assert.Equal(14, TourService.ToUpcoming(Row(Today.AddDays(14)), Today).DaysUntilDeparture);
    }

    [Fact]
    public void Days_until_departure_cross_month_and_year_ends()
    {
        Assert.Equal(9, TourService.ToUpcoming(Row(new DateOnly(2027, 1, 1)), new DateOnly(2026, 12, 23))
            .DaysUntilDeparture);
    }

    [Fact]
    public void Available_seats_are_capacity_minus_reserved_and_never_negative()
    {
        Assert.Equal(3, TourService.ToUpcoming(Row(Today.AddDays(2), 30, 27), Today).AvailableSeats);
        Assert.Equal(0, TourService.ToUpcoming(Row(Today.AddDays(2), 30, 31), Today).AvailableSeats);
    }

    [Fact]
    public void Departure_price_and_ids_pass_through_unchanged()
    {
        var dto = TourService.ToUpcoming(Row(Today.AddDays(3)), Today);
        Assert.Equal(("11", "5", "Hà Nội", 2_490_000m),
            (dto.DepartureId, dto.TourId, dto.DepartureFrom, dto.AdultPrice));
    }
}
