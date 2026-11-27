using System.Text;
using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Tests;

/// <summary>GET /api/tours/departure-days: the month calendar of the /tours date filter.</summary>
public sealed class TourDepartureDaysTests
{
    private static readonly DateOnly Today = new(2026, 11, 24);

    [Theory]
    [InlineData("2026-12", 2026, 12)]
    [InlineData(" 2026-11 ", 2026, 11)]
    [InlineData("2026-10", 2026, 10)]
    [InlineData("2028-11", 2028, 11)]
    public void A_month_is_its_first_day(string month, int year, int number)
        => Assert.Equal(new DateOnly(year, number, 1), TourSearchRules.ParseCalendarMonth(month, Today));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("2026-13")]
    [InlineData("12/2026")]
    [InlineData("2026-12-01")]
    [InlineData("2026-09")]
    [InlineData("2028-12")]
    public void A_missing_malformed_or_out_of_range_month_is_refused(string? month)
    {
        var error = Assert.Throws<ApiValidationException>(() => TourSearchRules.ParseCalendarMonth(month, Today));
        Assert.Contains("month", error.Errors.Keys);
    }

    [Fact]
    public void The_other_list_filters_still_apply_to_the_day_counts()
    {
        var sql = new StringBuilder("SELECT 1 FROM tours t WHERE t.status = 'published'");
        var command = new MySqlCommand();
        var search = TourSearch.None with { DestinationId = 7, MaxPrice = 3_000_000m, DepartureLocationIds = [4] };
        TourSearchSql.AppendFilters(sql, command, search);

        Assert.Contains("t.destination_id = @destination", sql.ToString());
        Assert.Contains("t.base_price <= @maxPrice", sql.ToString());
        Assert.Contains("dl.departure_location_id IN (@departureLocation0)", sql.ToString());
    }
}
