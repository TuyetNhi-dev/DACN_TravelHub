using System.Text;
using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Tests;

/// <summary>"Khởi hành từ" on /tours (ROADMAP 8.1): same city groups as frontend/src/lib/departure-region.ts.</summary>
public sealed class DepartureRegionTests
{
    [Theory]
    [InlineData("hcm", "TP. Hồ Chí Minh", true)]
    [InlineData("southeast", "TP. Hồ Chí Minh", true)]
    [InlineData("north", "TP. Hồ Chí Minh", false)]
    [InlineData("central", "Thành phố Đà Nẵng", true)]
    [InlineData("highlands", "Đà Lạt", true)]
    [InlineData("north", "Hòa Bình", true)]
    [InlineData("southwest", "Côn Đảo", false)]
    public void Departure_cities_are_matched_without_accents_or_prefixes(string region, string city, bool expected)
        => Assert.Equal(expected, DepartureRegions.Contains(region, city));

    [Fact]
    public void Only_the_six_regions_of_the_filter_exist()
    {
        foreach (var code in new[] { "hcm", "north", "central", "highlands", "southeast", "southwest" })
            Assert.True(DepartureRegions.IsValid(code));
        Assert.False(DepartureRegions.IsValid("all"));
        Assert.False(DepartureRegions.IsValid("NORTH"));
    }

    [Fact]
    public void The_query_keeps_a_valid_region_and_refuses_an_unknown_one()
    {
        var query = new TourSearchQuery(null, null, null, null, null, null, null, null, null, null, null, "north");
        Assert.Equal("north", TourSearchRules.Parse(query).DepartureRegion);

        var errors = Assert.Throws<ApiValidationException>(() =>
            TourSearchRules.Parse(query with { DepartureRegion = "north'; DROP" })).Errors;
        Assert.Contains("departureRegion", errors.Keys);
    }

    [Fact]
    public void The_region_becomes_one_parameter_per_departure_location()
    {
        var (sql, command) = Build(TourSearch.None with { DepartureRegion = "north", DepartureLocationIds = [3, 9] });

        Assert.Contains("dl.departure_location_id IN (@departureLocation0, @departureLocation1)", sql);
        Assert.Equal(3UL, command.Parameters["@departureLocation0"].Value);
        Assert.Equal(9UL, command.Parameters["@departureLocation1"].Value);
        Assert.Equal(sql.Count(c => c == '('), sql.Count(c => c == ')'));
    }

    [Fact]
    public void A_region_without_any_departure_city_matches_nothing()
    {
        var (sql, command) = Build(TourSearch.None with { DepartureRegion = "highlands", DepartureLocationIds = [] });

        Assert.EndsWith(" AND FALSE", sql);
        Assert.Empty(command.Parameters);
    }

    private static (string Sql, MySqlCommand Command) Build(TourSearch search)
    {
        var sql = new StringBuilder("SELECT 1 FROM tours t WHERE t.status = 'published'");
        var command = new MySqlCommand();
        TourSearchSql.AppendFilters(sql, command, search);
        return (sql.ToString(), command);
    }
}
