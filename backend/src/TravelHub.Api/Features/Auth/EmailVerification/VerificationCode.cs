using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace TravelHub.Api.Features.Auth.EmailVerification;

/// <summary>
/// 6-digit email OTP. Only a hash bound to the user id is stored, so equal codes for two users never collide
/// on the unique index. A short lifetime and an attempt limit make guessing (1 in a million) impractical.
/// </summary>
public static class VerificationCode
{
    public const int Digits = 6;
    public const int MaxFailedAttempts = 5;
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
    public static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);
    private const int Modulus = 1_000_000;

    public static string Create() =>
        RandomNumberGenerator.GetInt32(Modulus).ToString("D6", CultureInfo.InvariantCulture);

    public static string Hash(ulong userId, string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{userId}:{code}"))).ToLowerInvariant();

    public static bool HasValidShape(string? code) => code is { Length: Digits } && code.All(char.IsAsciiDigit);

    /// <summary>Constant-time comparison so response timing does not leak how many characters matched.</summary>
    public static bool Matches(string storedHash, ulong userId, string code) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(storedHash), Encoding.ASCII.GetBytes(Hash(userId, code)));
}
