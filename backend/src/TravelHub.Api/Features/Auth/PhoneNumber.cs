using System.Text.RegularExpressions;

namespace TravelHub.Api.Features.Auth;

/// <summary>Phone rules for customer contact numbers.</summary>
public static partial class PhoneNumber
{
    public const string InvalidMessage = "Số điện thoại cần 9–15 chữ số, có thể bắt đầu bằng +.";
    public const string InvalidVietnameseMessage =
        "Số điện thoại chưa đúng định dạng Việt Nam, ví dụ 0912 345 678 hoặc 028 3812 3456.";

    /// <summary>The saved contact number and service requests: 9–15 digits, optional leading +.</summary>
    public static bool IsValid(string? value) => !string.IsNullOrWhiteSpace(value) && Pattern().IsMatch(value.Trim());

    /// <summary>
    /// Sign-up: a Vietnamese mobile (03/05/07/08/09 + 8 digits) or landline (02 + 9 digits), written with 0, 84 or
    /// +84 and optional spaces, dots or dashes. Returns the number as "0…" digits, which also passes
    /// <see cref="IsValid"/>, or null when it is not a Vietnamese number.
    /// </summary>
    public static string? NormalizeVietnamese(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var compact = Separators().Replace(value.Trim(), "");
        var match = VietnamesePattern().Match(compact);
        return match.Success ? "0" + match.Groups["number"].Value : null;
    }

    [GeneratedRegex(@"^\+?[0-9]{9,15}$")]
    private static partial Regex Pattern();

    [GeneratedRegex(@"[\s.\-]")]
    private static partial Regex Separators();

    [GeneratedRegex(@"^(?:0|\+84|84)(?<number>[35789][0-9]{8}|2[0-9]{9})$")]
    private static partial Regex VietnamesePattern();
}
