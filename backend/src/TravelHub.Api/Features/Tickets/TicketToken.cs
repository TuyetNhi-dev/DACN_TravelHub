using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace TravelHub.Api.Features.Tickets;

/// <summary>A QR payload that passed the signature check; the ticket row still has to be looked up.</summary>
public sealed record TicketClaim(string Code, int Version);

/// <summary>
/// The text inside an e-ticket QR: "SH1.&lt;code&gt;.&lt;version&gt;.&lt;signature&gt;". The signature is the first
/// 128 bits of HMAC-SHA256 over the part before it, base64url. Nothing personal is inside; the code is random.
/// </summary>
public static class TicketToken
{
    public const string Prefix = "SH1";
    public const int CodeLength = 12;
    /// <summary>Upper bound of a well-formed payload; longer scanner input is refused before any work.</summary>
    public const int MaxPayloadLength = 64;
    private const int SignatureBytes = 16;
    private const char Separator = '.';
    // Crockford base32: no I, L, O or U, so a code read aloud or typed is not misread.
    private const string Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

    public static string NewCode() =>
        string.Create(CodeLength, 0, (span, _) =>
        {
            for (var i = 0; i < span.Length; i++) span[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        });

    public static string Sign(string code, int version, string key)
    {
        var body = Body(code, version);
        return body + Separator + Signature(body, key);
    }

    /// <summary>Null when the text is not a payload of ours or its signature does not match.</summary>
    public static TicketClaim? Verify(string? payload, string key)
    {
        if (string.IsNullOrEmpty(payload) || payload.Length > MaxPayloadLength) return null;
        var parts = payload.Trim().Split(Separator);
        if (parts.Length != 4 || parts[0] != Prefix || !IsCode(parts[1])) return null;
        if (!int.TryParse(parts[2], NumberStyles.None, CultureInfo.InvariantCulture, out var version) || version < 1)
            return null;
        var expected = Encoding.ASCII.GetBytes(Signature(Body(parts[1], version), key));
        var actual = Encoding.ASCII.GetBytes(parts[3]);
        return CryptographicOperations.FixedTimeEquals(expected, actual) ? new TicketClaim(parts[1], version) : null;
    }

    private static bool IsCode(string value) => value.Length == CodeLength && value.All(Alphabet.Contains);

    private static string Body(string code, int version) =>
        string.Join(Separator, Prefix, code, version.ToString(CultureInfo.InvariantCulture));

    private static string Signature(string body, string key)
    {
        var mac = HMACSHA256.HashData(Encoding.UTF8.GetBytes(key), Encoding.ASCII.GetBytes(body));
        return Convert.ToBase64String(mac, 0, SignatureBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }
}
