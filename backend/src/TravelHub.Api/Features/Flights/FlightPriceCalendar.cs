using System.Globalization;

namespace TravelHub.Api.Features.Flights;

/// <summary>Pure calendar rules, kept apart from SQL so they can be unit tested.</summary>
public static class FlightPriceCalendar
{
    public const string MonthFormat = "yyyy-MM";

    /// <summary>Partners quote up to about a year ahead; later months are rejected rather than shown empty.</summary>
    public const int MaxMonthsAhead = 11;

    public static bool TryParseMonth(string? raw, out DateOnly firstDay)
    {
        firstDay = default;
        if (!DateOnly.TryParseExact(raw?.Trim(), MonthFormat, CultureInfo.InvariantCulture, DateTimeStyles.None,
                out var parsed)) return false;
        firstDay = new DateOnly(parsed.Year, parsed.Month, 1);
        return true;
    }

    public static bool IsWithinBookingWindow(DateOnly firstDay, DateOnly today)
    {
        var current = new DateOnly(today.Year, today.Month, 1);
        return firstDay >= current && firstDay <= current.AddMonths(MaxMonthsAhead);
    }

    /// <summary>
    /// One entry per day from first to last inclusive. Every day sharing the lowest price is marked cheapest,
    /// so the calendar never pretends one day is uniquely cheapest when several tie.
    /// </summary>
    public static IReadOnlyList<FlightDayPriceDto> BuildDays(DateOnly first, DateOnly last,
        IReadOnlyList<FlightDayLowest> rows)
    {
        var byDay = rows.ToDictionary(row => row.Date);
        decimal? cheapest = rows.Count == 0 ? null : rows.Min(row => row.LowestPrice);
        var days = new List<FlightDayPriceDto>();
        for (var day = first; day <= last; day = day.AddDays(1))
        {
            var row = byDay.GetValueOrDefault(day);
            days.Add(new FlightDayPriceDto(day, row?.LowestPrice, row?.OfferCount ?? 0,
                row is not null && row.LowestPrice == cheapest));
        }
        return days;
    }
}
