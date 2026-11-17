using System.Security.Cryptography;

namespace TravelHub.Api.Features.Bookings;

/// <summary>Human-friendly order code, e.g. SH261116K7Q2MX. Ambiguous characters (0/O, 1/I) are excluded.</summary>
public static class BookingCodeGenerator
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int RandomLength = 6;

    public static string Create(DateOnly today) =>
        "SH" + today.ToString("yyMMdd", System.Globalization.CultureInfo.InvariantCulture)
        + new string(RandomNumberGenerator.GetItems<char>(Alphabet, RandomLength));
}
