using System.Globalization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Email;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Auth.EmailVerification;

namespace TravelHub.Api.Features.Auth.PasswordReset;

/// <summary>Limits of the "Quên mật khẩu" flow. Pure, so they are unit tested.</summary>
public static class PasswordResetRules
{
    public const int MaxCodesPerHour = 5;
    public static readonly TimeSpan HourWindow = TimeSpan.FromHours(1);

    /// <summary>
    /// Accounts that may reset: active ones, Google-only ones, and sign-ups that never confirmed the email.
    /// </summary>
    public static bool CanReset(Account? account) =>
        account is { Status: AccountStatus.Active or AccountStatus.Pending };

    /// <summary>One code per cooldown and at most five per hour, so the form cannot flood an inbox.</summary>
    public static bool MayIssue(int codesInCooldown, int codesInLastHour) =>
        codesInCooldown == 0 && codesInLastHour < MaxCodesPerHour;
}

/// <summary>
/// Password reset with the existing 6-digit email OTP (purpose reset_password). Both steps answer the same way
/// whether or not the email is registered. A correct code stores the new password, confirms the email of a pending
/// sign-up, and ends every existing session (the session stamp follows the password hash).
/// </summary>
public sealed class PasswordResetService(
    EmailVerificationRepository codes,
    AuthRepository accounts,
    IPasswordHasher<string> hasher,
    IEmailSender sender,
    IOptions<EmailOptions> options,
    VietnamClock clock)
{
    public const string RequestMessage = "Nếu email đã đăng ký tài khoản SàiHành, chúng tôi vừa gửi mã đặt lại "
        + "mật khẩu gồm 6 chữ số. Hãy kiểm tra cả mục Spam.";
    public const string InvalidCode = "Mã không đúng hoặc đã hết hạn. Hãy kiểm tra lại hoặc gửi lại mã.";
    public const string DoneMessage = "Đã đặt mật khẩu mới. Vui lòng đăng nhập bằng mật khẩu mới.";

    /// <summary>
    /// Sends a code when the account may reset and the limits allow it; otherwise does nothing. The caller always
    /// answers <see cref="RequestMessage"/>. A failed mail is not reported either, for the same reason.
    /// </summary>
    public async Task RequestAsync(PasswordResetRequest request, CancellationToken ct)
    {
        if (!AuthService.IsValidEmail(request.Email)) throw ApiException.BadRequest("Email không hợp lệ.");
        var account = await accounts.FindByEmailAsync(AuthService.NormalizeEmail(request.Email!), ct);
        if (!PasswordResetRules.CanReset(account)) return;
        var userId = ParseId(account!);
        var now = clock.UtcNow;
        var recent = await codes.CountCodesSinceAsync(userId, CodePurpose.ResetPassword,
            now - VerificationCode.ResendCooldown, ct);
        var lastHour = await codes.CountCodesSinceAsync(userId, CodePurpose.ResetPassword,
            now - PasswordResetRules.HourWindow, ct);
        if (!PasswordResetRules.MayIssue(recent, lastHour)) return;

        var code = VerificationCode.Create();
        await codes.SaveCodeAsync(userId, CodePurpose.ResetPassword, VerificationCode.Hash(userId, code), now, ct);
        await sender.SendAsync(VerificationEmail.BuildPasswordReset(account!.User.Email, account.User.FullName, code,
            options.Value.FrontendBaseUrl), ct);
    }

    /// <summary>
    /// Wrong code, expired code, too many tries and unknown email all give <see cref="InvalidCode"/>: unlike
    /// sign-up verification, no "attempts left" count is shown, because anyone can start a reset for any address.
    /// </summary>
    public async Task ConfirmAsync(PasswordResetConfirmRequest request, CancellationToken ct)
    {
        Validate(request);
        var email = AuthService.NormalizeEmail(request.Email!);
        // Hashed before the lookup, so known and unknown addresses take the same time.
        var newHash = hasher.HashPassword(email, request.NewPassword!);
        var account = await accounts.FindByEmailAsync(email, ct);
        if (!PasswordResetRules.CanReset(account)) throw ApiException.BadRequest(InvalidCode);
        var userId = ParseId(account!);
        var code = request.Code!.Trim();
        var result = await codes.TryResetPasswordAsync(userId,
            pending => VerificationCode.Matches(pending.CodeHash, userId, code), newHash, clock.UtcNow, ct);
        if (result.Outcome != CodeCheck.Verified) throw ApiException.BadRequest(InvalidCode);
    }

    public static void Validate(PasswordResetConfirmRequest request)
    {
        var errors = new ValidationErrors();
        errors.AddIf(!AuthService.IsValidEmail(request.Email), "email", "Email không hợp lệ.");
        errors.AddIf(!VerificationCode.HasValidShape(request.Code?.Trim()), "code", "Vui lòng nhập mã gồm 6 chữ số.");
        PasswordRules.AddErrors(errors, request.NewPassword, request.ConfirmPassword, "newPassword");
        errors.ThrowIfAny();
    }

    private static ulong ParseId(Account account) => ulong.Parse(account.User.Id, CultureInfo.InvariantCulture);
}
