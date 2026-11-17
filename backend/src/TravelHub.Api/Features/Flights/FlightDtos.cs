namespace TravelHub.Api.Features.Flights;

/// <summary>
/// One sellable fare for a flight. Times are UTC instants; the frontend renders Vietnam time.
/// RemainingSeats is set only for deals (SàiHành's seat allotment), which are confirmed on payment; any other
/// quote is not a seat guarantee and the partner confirms after the order is placed.
/// </summary>
public sealed record FlightOfferDto(
    string FlightId,
    string OfferId,
    string FlightNumber,
    string Airline,
    string? AirlineCode,
    string OriginCode,
    string OriginCity,
    string DestinationCode,
    string DestinationCity,
    DateTime DepartAt,
    DateTime ArriveAt,
    int DurationMinutes,
    string CabinClass,
    decimal ReferencePrice,
    string? BaggageTerms,
    string? ChangeCancelTerms,
    DateTime? QuoteExpiresAt,
    int? RemainingSeats)
{
    public bool InstantConfirmation => RemainingSeats is not null;
}

public sealed record FlightSearchQuery(string? From, string? To, DateOnly? Date, string? Cabin);

public static class CabinClass
{
    public const string Economy = "economy";
    public const string PremiumEconomy = "premium_economy";
    public const string Business = "business";
    public const string First = "first";

    public static readonly IReadOnlySet<string> All = new HashSet<string> { Economy, PremiumEconomy, Business, First };
}

/// <summary>Lowest sellable reference quote on one Vietnamese departure day; null when no partner quoted it.</summary>
public sealed record FlightDayPriceDto(DateOnly Date, decimal? LowestPrice, int OfferCount, bool IsCheapest);

/// <summary>One month of daily lowest reference quotes for a route; Month is "yyyy-MM" in Vietnam time.</summary>
public sealed record FlightPriceCalendarDto(
    string From,
    string To,
    string Cabin,
    string Month,
    decimal? CheapestPrice,
    IReadOnlyList<FlightDayPriceDto> Days);

public sealed record FlightPriceCalendarQuery(string? From, string? To, string? Month, string? Cabin);

/// <summary>A validated route: both airport codes present and different, cabin defaulted to economy.</summary>
public sealed record FlightRoute(string From, string To, string Cabin);

/// <summary>Repository row: the lowest quote and the number of quotes on one Vietnamese day.</summary>
public sealed record FlightDayLowest(DateOnly Date, decimal LowestPrice, int OfferCount);

/// <summary>Sum of the lowest outbound and return quotes for one pair of days; null when either leg has none.</summary>
public sealed record RoundTripFareDto(DateOnly DepartDate, DateOnly ReturnDate, decimal? Total, bool IsCheapest);

/// <summary>
/// Lowest quotes within ±3 days of the requested dates. One-way searches leave ReturnDays and RoundTrips empty.
/// Round trips are two separate one-way quotes (and two orders); the total is only a comparison aid.
/// </summary>
public sealed record FlexibleFaresDto(
    string From,
    string To,
    string Cabin,
    DateOnly Date,
    DateOnly? ReturnDate,
    IReadOnlyList<FlightDayPriceDto> OutboundDays,
    IReadOnlyList<FlightDayPriceDto> ReturnDays,
    IReadOnlyList<RoundTripFareDto> RoundTrips,
    decimal? CheapestTotal);

public sealed record FlexibleFaresQuery(string? From, string? To, DateOnly? Date, DateOnly? ReturnDate, string? Cabin);

/// <summary>
/// One route's headline deal on /flights/deals: the staff-featured deal when there is one, otherwise the lowest
/// economy deal with seats left, departing within FlightDeals.WindowDays. Deals are confirmed on payment.
/// </summary>
public sealed record FlightDealDto(
    string OfferId,
    string FlightId,
    string OriginCode,
    string OriginCity,
    string DestinationCode,
    string DestinationCity,
    DateTime DepartAt,
    string Airline,
    string? AirlineCode,
    string FlightNumber,
    string CabinClass,
    decimal ReferencePrice,
    bool IsFeatured,
    DateTime QuoteUpdatedAt,
    int RemainingSeats);

public static class FlightDeals
{
    /// <summary>"Săn vé rẻ" looks this many Vietnamese days ahead, starting today.</summary>
    public const int WindowDays = 30;
}
