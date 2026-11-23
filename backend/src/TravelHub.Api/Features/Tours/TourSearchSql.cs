using System.Text;
using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Tours;

/// <summary>
/// WHERE and ORDER BY of the public tour search. Only fixed SQL text is appended; every value goes in as a parameter.
/// Expects the aliases of TourRepository: t (tours) and destination (locations).
/// </summary>
public static class TourSearchSql
{
    // utf8mb4_0900_ai_ci ignores case and accents except "đ", which has its own letter weight, so it is replaced first.
    private const string TextMatch = """
        REPLACE(LOWER(CONCAT_WS(' ', t.title, t.code, destination.name)), 'đ', 'd') COLLATE utf8mb4_0900_ai_ci
        LIKE @text
        """;

    /// <summary>Same bookable rule as TourService.IsBookable, limited to the requested date range.</summary>
    private const string BookableDeparture = """
        EXISTS (SELECT 1 FROM tour_departures d
            WHERE d.tour_id = t.id AND d.status = 'open' AND d.departure_date > @today
              AND d.reserved_seats < d.capacity
        """;

    public static void AppendFilters(StringBuilder sql, MySqlCommand command, TourSearch search)
    {
        SqlFilter.AddIfPresent(sql, command, TextMatch, "@text",
            search.Text is null ? null : SqlText.Contains(search.Text));
        SqlFilter.AddIfPresent(sql, command, "t.destination_id = @destination", "@destination", search.DestinationId);
        SqlFilter.AddIfPresent(sql, command, "t.duration_days >= @minDays", "@minDays", search.MinDays);
        SqlFilter.AddIfPresent(sql, command, "t.duration_days <= @maxDays", "@maxDays", search.MaxDays);
        SqlFilter.AddIfPresent(sql, command, "t.base_price <= @maxPrice", "@maxPrice", search.MaxPrice);
        if (search.DateFrom is null && search.DateTo is null) return;
        sql.Append(" AND ").Append(BookableDeparture);
        if (search.DateFrom is { } from) Bind(sql, command, " AND d.departure_date >= @dateFrom", "@dateFrom", from);
        if (search.DateTo is { } to) Bind(sql, command, " AND d.departure_date <= @dateTo", "@dateTo", to);
        sql.Append(')');
    }

    /// <summary>A chosen price order wins over the region priority; ties always fall back to the tour id.</summary>
    public static string OrderBy(TourSearch search) => search.Sort switch
    {
        TourSort.PriceAscending => " ORDER BY t.base_price, t.id",
        TourSort.PriceDescending => " ORDER BY t.base_price DESC, t.id",
        _ => search.Region is null ? " ORDER BY t.id" : RegionFirstOrder,
    };

    /// <summary>Tours with an open departure run from the chosen region first; nothing is filtered out.</summary>
    private const string RegionFirstOrder = """
         ORDER BY EXISTS (SELECT 1 FROM tour_departures d
             JOIN branches b ON b.id = d.operating_branch_id JOIN regions r ON r.id = b.region_id
             WHERE d.tour_id = t.id AND d.status = 'open' AND d.departure_date > @today AND r.code = @region) DESC,
             t.id
        """;

    private static void Bind(StringBuilder sql, MySqlCommand command, string condition, string name, object value)
    {
        sql.Append(condition);
        command.Parameters.AddWithValue(name, value);
    }
}
