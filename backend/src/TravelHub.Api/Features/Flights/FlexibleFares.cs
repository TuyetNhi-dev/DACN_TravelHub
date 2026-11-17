namespace TravelHub.Api.Features.Flights;

/// <summary>Pure rules for the ±3-day comparison, kept apart from SQL so they can be unit tested.</summary>
public static class FlexibleFares
{
    public const int DaysEachSide = 3;
    public const int WindowLength = DaysEachSide * 2 + 1;

    /// <summary>Seven days centred on the requested day, shifted forward so none is before `earliest`.</summary>
    public static (DateOnly First, DateOnly Last) Window(DateOnly center, DateOnly earliest)
    {
        var first = center.AddDays(-DaysEachSide);
        if (first < earliest) first = earliest;
        return (first, first.AddDays(WindowLength - 1));
    }

    /// <summary>
    /// Every (outbound, return) pair whose return is not before the outbound day. Totals tie-mark all cheapest
    /// pairs; a pair with a missing leg has no total and is never cheapest.
    /// </summary>
    public static IReadOnlyList<RoundTripFareDto> Combine(IReadOnlyList<FlightDayPriceDto> outbound,
        IReadOnlyList<FlightDayPriceDto> inbound)
    {
        var pairs = (from leaving in outbound
                     from returning in inbound
                     where returning.Date >= leaving.Date
                     select (Depart: leaving.Date, Return: returning.Date,
                         Total: SumOrNull(leaving.LowestPrice, returning.LowestPrice)))
            .ToList();
        var cheapest = pairs.Min(pair => pair.Total);
        return pairs.Select(pair => new RoundTripFareDto(pair.Depart, pair.Return, pair.Total,
            pair.Total is not null && pair.Total == cheapest)).ToList();
    }

    private static decimal? SumOrNull(decimal? first, decimal? second) =>
        first is { } a && second is { } b ? a + b : null;
}
