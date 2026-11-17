namespace TravelHub.Api.Features.Flights;

/// <summary>
/// One sellable fare quote for a flight. Times are UTC instants; the frontend renders Vietnam time.
/// The quote is not a seat guarantee: the supplier confirms after the order is placed.
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
    DateTime? QuoteExpiresAt);

public sealed record FlightSearchQuery(string? From, string? To, DateOnly? Date, string? Cabin);

public static class CabinClass
{
    public const string Economy = "economy";
    public const string PremiumEconomy = "premium_economy";
    public const string Business = "business";
    public const string First = "first";

    public static readonly IReadOnlySet<string> All = new HashSet<string> { Economy, PremiumEconomy, Business, First };
}
