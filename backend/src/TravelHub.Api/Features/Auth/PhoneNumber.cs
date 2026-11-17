using System.Text.RegularExpressions;

namespace TravelHub.Api.Features.Auth;

/// <summary>One rule for every place a customer phone is accepted: sign-up and the saved contact number.</summary>
public static partial class PhoneNumber
{
    public const string InvalidMessage = "Số điện thoại cần 9–15 chữ số, có thể bắt đầu bằng +.";

    public static bool IsValid(string? value) => !string.IsNullOrWhiteSpace(value) && Pattern().IsMatch(value.Trim());

    [GeneratedRegex(@"^\+?[0-9]{9,15}$")]
    private static partial Regex Pattern();
}
