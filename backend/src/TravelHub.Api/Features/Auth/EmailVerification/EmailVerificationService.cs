using System.Globalization;
using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Email;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Configuration;

namespace TravelHub.Api.Features.Auth.EmailVerification;

public sealed class EmailVerificationService(
    EmailVerificationRepository repository,
    AuthRepository accounts,
    IEmailSender sender,
    IOptions<EmailOptions> options,
    VietnamClock clock)
{
    private const string InvalidCode = "Mã xác nhận không đúng hoặc đã hết hạn. Hãy kiểm tra lại hoặc gửi lại mã.";

    /// <summary>Creates a fresh code for a pending account and emails it. Returns whether the mail was sent.</summary>
    public async Task<bool> IssueAsync(ulong userId, string email, string fullName, CancellationToken ct)
    {
        var code = VerificationCode.Create();
        await repository.SaveCodeAsync(userId, CodePurpose.VerifyEmail, VerificationCode.Hash(userId, code),
            clock.UtcNow, ct);
        var message = VerificationEmail.Build(email, fullName, code, options.Value.FrontendBaseUrl);
        return await sender.SendAsync(message, ct);
    }

    /// <summary>
    /// Unknown, already active and pending accounts get the same "wrong code" answer, so the endpoint does not
    /// reveal which emails are registered.
    /// </summary>
    public async Task<Account> VerifyAsync(VerifyEmailRequest request, CancellationToken ct)
    {
        if (!AuthService.IsValidEmail(request.Email) || !VerificationCode.HasValidShape(request.Code?.Trim()))
            throw ApiException.BadRequest("Vui lòng nhập email và mã gồm 6 chữ số.");
        var account = await accounts.FindByEmailAsync(AuthService.NormalizeEmail(request.Email!), ct);
        if (account is null || account.Status != AccountStatus.Pending) throw ApiException.BadRequest(InvalidCode);

        var userId = ParseId(account);
        var code = request.Code!.Trim();
        var result = await repository.TryVerifyEmailAsync(userId,
            pending => VerificationCode.Matches(pending.CodeHash, userId, code), clock.UtcNow, ct);
        if (result.Outcome == CodeCheck.Verified) return (await accounts.FindByIdAsync(userId, ct))!;
        throw ApiException.BadRequest(result.Outcome == CodeCheck.Wrong && result.AttemptsLeft > 0
            ? $"Mã xác nhận không đúng. Bạn còn {result.AttemptsLeft} lần thử."
            : InvalidCode);
    }

    /// <summary>
    /// Silently does nothing for unknown, already active or recently mailed accounts, so the response never
    /// reveals whether an email is registered and the endpoint cannot be used to flood an inbox.
    /// </summary>
    public async Task ResendAsync(ResendVerificationRequest request, CancellationToken ct)
    {
        if (!AuthService.IsValidEmail(request.Email)) throw ApiException.BadRequest("Email không hợp lệ.");
        var account = await accounts.FindByEmailAsync(AuthService.NormalizeEmail(request.Email!), ct);
        if (account is null || account.Status != AccountStatus.Pending) return;
        var userId = ParseId(account);
        if (await repository.CountCodesSinceAsync(userId, CodePurpose.VerifyEmail,
                clock.UtcNow - VerificationCode.ResendCooldown, ct) > 0) return;
        await IssueAsync(userId, account.User.Email, account.User.FullName, ct);
    }

    private static ulong ParseId(Account account) => ulong.Parse(account.User.Id, CultureInfo.InvariantCulture);
}
