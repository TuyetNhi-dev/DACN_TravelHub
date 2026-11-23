using System.Text;
using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Tests;

/// <summary>Filters of GET /api/tours (ROADMAP 8.1): validation, accent-free text and the SQL they add.</summary>
public sealed class TourSearchTests
{
    private static TourSearchQuery Query(string? q = null, string? destinationId = null, int? minDays = null,
        int? maxDays = null, DateOnly? dateFrom = null, DateOnly? dateTo = null, decimal? maxPrice = null,
        string? sort = null, string? region = null) =>
        new(q, destinationId, minDays, maxDays, dateFrom, dateTo, maxPrice, sort, region, null, null);

    private static IReadOnlyDictionary<string, string[]> Errors(TourSearchQuery query) =>
        Assert.Throws<ApiValidationException>(() => TourSearchRules.Parse(query)).Errors;

    [Theory]
    [InlineData("Đà Nẵng", "da nang")]
    [InlineData("  HẠ   LONG ", "ha long")]
    [InlineData("Phú Quốc – Hòn Thơm", "phu quoc – hon thom")]
    [InlineData("SH-MB-001", "sh-mb-001")]
    public void Search_text_is_lower_case_without_accents_and_single_spaced(string input, string expected)
    {
        Assert.Equal(expected, SearchText.Normalize(input));
    }

    [Fact]
    public void No_filter_gives_the_same_search_as_before()
    {
        Assert.Equal(TourSearch.None, TourSearchRules.Parse(Query(q: "  ", destinationId: "", sort: "")));
    }

    [Fact]
    public void Valid_filters_are_kept_and_text_is_normalised()
    {
        var search = TourSearchRules.Parse(Query("Đà Lạt", "29", 2, 4, new(2026, 12, 1), new(2026, 12, 31), 5_000_000m,
            "price_desc", "SOUTH"));
        Assert.Equal(new TourSearch("da lat", 29UL, 2, 4, new(2026, 12, 1), new(2026, 12, 31), 5_000_000m,
            TourSort.PriceDescending, "SOUTH"), search);
    }

    [Fact]
    public void Each_invalid_filter_reports_its_own_field()
    {
        var errors = Errors(Query(q: new string('a', 101), destinationId: "abc", minDays: 0, maxDays: 61,
            maxPrice: -1, sort: "cheapest"));
        foreach (var field in new[] { "q", "destinationId", "minDays", "maxDays", "maxPrice", "sort" })
            Assert.Contains(field, errors.Keys);
    }

    [Fact]
    public void Ranges_must_not_be_reversed()
    {
        Assert.Contains("maxDays", Errors(Query(minDays: 5, maxDays: 3)).Keys);
        Assert.Contains("dateTo", Errors(Query(dateFrom: new(2026, 12, 10), dateTo: new(2026, 12, 1))).Keys);
    }

    [Fact]
    public void An_unknown_region_is_refused_as_before()
    {
        Assert.Throws<ApiException>(() => TourSearchRules.Parse(Query(region: "south'; DROP")));
    }

    [Fact]
    public void Typed_text_only_ever_reaches_sql_as_a_parameter()
    {
        var (sql, command) = Build(new TourSearch("x' OR 1=1 -- 100%", null, null, null, null, null, null,
            TourSort.Default, null));
        Assert.DoesNotContain("OR 1=1", sql);
        Assert.Contains("COLLATE utf8mb4_0900_ai_ci", sql);
        Assert.Equal(@"%x' OR 1=1 -- 100\%%", command.Parameters["@text"].Value);
    }

    [Fact]
    public void Each_present_filter_adds_one_parameterised_condition()
    {
        var (sql, command) = Build(new TourSearch(null, 7UL, 2, 5, null, null, 3_000_000m, TourSort.Default, null));
        Assert.Contains("t.destination_id = @destination", sql);
        Assert.Contains("t.duration_days >= @minDays", sql);
        Assert.Contains("t.duration_days <= @maxDays", sql);
        Assert.Contains("t.base_price <= @maxPrice", sql);
        Assert.DoesNotContain("tour_departures", sql);
        Assert.Equal(4, command.Parameters.Count);
    }

    [Fact]
    public void A_date_range_needs_a_bookable_departure_inside_it()
    {
        var (sql, command) = Build(new TourSearch(null, null, null, null, new(2026, 12, 1), null, null,
            TourSort.Default, null));
        Assert.Contains("d.departure_date > @today", sql);
        Assert.Contains("d.reserved_seats < d.capacity", sql);
        Assert.Contains("d.departure_date >= @dateFrom", sql);
        Assert.DoesNotContain("@dateTo", sql);
        Assert.Equal(sql.Count(c => c == '('), sql.Count(c => c == ')'));
        Assert.Equal(new DateOnly(2026, 12, 1), command.Parameters["@dateFrom"].Value);
    }

    [Theory]
    [InlineData(TourSort.PriceAscending, null, " ORDER BY t.base_price, t.id")]
    [InlineData(TourSort.PriceDescending, "SOUTH", " ORDER BY t.base_price DESC, t.id")]
    [InlineData(TourSort.Default, null, " ORDER BY t.id")]
    public void A_chosen_price_order_wins_over_the_region_priority(TourSort sort, string? region, string expected)
    {
        Assert.Equal(expected, TourSearchSql.OrderBy(TourSearch.None with { Sort = sort, Region = region }));
    }

    [Fact]
    public void Without_a_price_order_the_chosen_region_comes_first()
    {
        Assert.Contains("r.code = @region", TourSearchSql.OrderBy(TourSearch.None with { Region = "NORTH" }));
    }

    private static (string Sql, MySqlCommand Command) Build(TourSearch search)
    {
        var sql = new StringBuilder("SELECT 1 FROM tours t WHERE t.status = 'published'");
        var command = new MySqlCommand();
        TourSearchSql.AppendFilters(sql, command, search);
        return (sql.ToString(), command);
    }
}
