using System.Security.Cryptography;

namespace TravelHub.Api.Features.Bookings;

/// <summary>Human-friendly order code, e.g. SH261116K7Q2MX. Ambiguous characters (0/O, 1/I) are excluded.</summary>
public static class BookingCodeGenerator
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int RandomLength = 6;

    public const string BookingPrefix = "SH";

    public static string Create(DateOnly today) => Create(BookingPrefix, today);

    /// <summary>Same format with another prefix, e.g. "YC" for service requests.</summary>
    public static string Create(string prefix, DateOnly today) =>
        prefix + today.ToString("yyMMdd", System.Globalization.CultureInfo.InvariantCulture)
        + new string(RandomNumberGenerator.GetItems<char>(Alphabet, RandomLength));
}
