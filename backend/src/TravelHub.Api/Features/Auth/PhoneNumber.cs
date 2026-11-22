using System.Text.RegularExpressions;

namespace TravelHub.Api.Features.Auth;

/// <summary>
/// The one phone rule of the site (sign-up, the saved contact phone and service requests): SàiHành sells domestic
/// travel and staff call customers back on Vietnamese numbers. Mirrored by frontend/src/lib/phone-vn.ts.
/// </summary>
public static partial class PhoneNumber
{
    public const string InvalidMessage =
        "Số điện thoại chưa đúng định dạng Việt Nam, ví dụ 0912 345 678 hoặc 028 3812 3456.";

    /// <summary>
    /// A Vietnamese mobile (03/05/07/08/09 + 8 digits) or landline (02 + 9 digits), written with 0, 84 or +84 and
    /// optional spaces, dots, dashes or brackets. Returns the number as "0…" digits, or null when it is not one.
    /// </summary>
    public static string? NormalizeVietnamese(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var compact = Separators().Replace(value.Trim(), "");
        var match = VietnamesePattern().Match(compact);
        return match.Success ? "0" + match.Groups["number"].Value : null;
    }

    [GeneratedRegex(@"[\s.\-()]")]
    private static partial Regex Separators();

    [GeneratedRegex(@"^(?:0|\+84|84)(?<number>[35789][0-9]{8}|2[0-9]{9})$")]
    private static partial Regex VietnamesePattern();
}
