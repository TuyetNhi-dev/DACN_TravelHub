using TravelHub.Api.Common.Errors;

namespace TravelHub.Api.Features.Auth;

/// <summary>One password rule for sign-up and password reset (the frontend strength hint mirrors it).</summary>
public static class PasswordRules
{
    public const int MinLength = 12;
    public const int MaxLength = 128;

    public static void AddErrors(ValidationErrors errors, string? password, string? confirmation,
        string passwordField = "password", string confirmationField = "confirmPassword")
    {
        errors.AddIf(password is null || password.Length is < MinLength or > MaxLength, passwordField,
            $"Mật khẩu cần từ {MinLength} đến {MaxLength} ký tự.");
        errors.AddIf(password != confirmation, confirmationField, "Mật khẩu xác nhận không khớp.");
    }
}
