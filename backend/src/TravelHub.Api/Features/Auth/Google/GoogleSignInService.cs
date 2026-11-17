using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Configuration;

namespace TravelHub.Api.Features.Auth.Google;

/// <summary>Verified identity taken from a Google ID token.</summary>
public sealed record GoogleIdentity(string Subject, string Email, string FullName);

public sealed class GoogleSignInService(
    AuthRepository accounts,
    IOptions<GoogleOptions> options,
    ILogger<GoogleSignInService> logger)
{
    private const int DuplicateKeyError = 1062;
    private const int MaxNameLength = 160;
    private const string Rejected = "Không thể đăng nhập bằng Google. Vui lòng thử lại.";

    public async Task<Account> SignInAsync(GoogleSignInRequest request, CancellationToken ct)
    {
        var identity = await ValidateAsync(request.Credential);
        var account = await accounts.FindByGoogleSubjectAsync(identity.Subject, ct)
            ?? await LinkOrCreateAsync(identity, ct);
        if (!account.IsActive) throw ApiException.Forbidden("Tài khoản này đang bị khóa. Vui lòng liên hệ SàiHành.");
        return account;
    }

    private async Task<GoogleIdentity> ValidateAsync(string? credential)
    {
        if (!options.Value.IsConfigured)
            throw ApiException.BadRequest("Đăng nhập bằng Google chưa được cấu hình trên máy chủ.");
        if (string.IsNullOrWhiteSpace(credential)) throw ApiException.BadRequest(Rejected);
        GoogleJsonWebSignature.Payload payload;
        try
        {
            // Checks Google's signature, issuer, expiry and that the token was issued for our Client ID.
            payload = await GoogleJsonWebSignature.ValidateAsync(credential,
                new GoogleJsonWebSignature.ValidationSettings { Audience = [options.Value.ClientId] });
        }
        catch (InvalidJwtException ex)
        {
            logger.LogWarning("Rejected Google ID token. Reason={Reason}", ex.GetType().Name);
            throw ApiException.Unauthorized(Rejected);
        }
        // Linking by email is only safe when Google itself has verified that address.
        if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email))
            throw ApiException.Unauthorized("Email Google của bạn chưa được xác minh.");
        return new GoogleIdentity(payload.Subject, AuthService.NormalizeEmail(payload.Email), DisplayName(payload));
    }

    private async Task<Account> LinkOrCreateAsync(GoogleIdentity identity, CancellationToken ct)
    {
        var existing = await accounts.FindByEmailAsync(identity.Email, ct);
        if (existing is not null)
        {
            // A locked account stays untouched instead of gaining a new way to sign in.
            if (existing.Status is not (AccountStatus.Active or AccountStatus.Pending))
                throw ApiException.Forbidden("Tài khoản này đang bị khóa. Vui lòng liên hệ SàiHành.");
            var userId = ulong.Parse(existing.User.Id, System.Globalization.CultureInfo.InvariantCulture);
            if (!await accounts.LinkGoogleAsync(userId, identity.Subject, ct))
                throw ApiException.Conflict("Email này đã liên kết với một tài khoản Google khác.");
            return (await accounts.FindByIdAsync(userId, ct))!;
        }
        try
        {
            var id = await accounts.CreateCustomerAsync(new NewCustomer(identity.FullName, identity.Email, null,
                null, identity.Subject, AccountStatus.Active), ct);
            return (await accounts.FindByIdAsync(id, ct))!;
        }
        catch (MySqlException ex) when (ex.Number == DuplicateKeyError)
        {
            // Two first sign-ins raced; the other request created the account.
            return await accounts.FindByGoogleSubjectAsync(identity.Subject, ct)
                ?? throw ApiException.Conflict(Rejected);
        }
    }

    private static string DisplayName(GoogleJsonWebSignature.Payload payload)
    {
        var name = string.IsNullOrWhiteSpace(payload.Name) ? payload.Email.Split('@')[0] : payload.Name.Trim();
        return name.Length > MaxNameLength ? name[..MaxNameLength] : name;
    }
}
