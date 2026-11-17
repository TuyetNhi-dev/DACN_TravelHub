using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Auth.EmailVerification;
using TravelHub.Api.Features.Auth.Google;

namespace TravelHub.Api.Features.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth").AddEndpointFilter<AntiforgeryFilter>();
        group.MapGet("/csrf", (HttpContext context, IAntiforgery antiforgery) =>
            Results.Ok(new CsrfTokenDto(antiforgery.GetAndStoreTokens(context).RequestToken)));

        group.MapPost("/register", async (RegisterRequest request, AuthService service, CancellationToken ct) =>
            Results.Ok(await service.RegisterAsync(request, ct)))
            .RequireRateLimiting(AuthOptions.RateLimitPolicy);

        group.MapPost("/login", async (LoginRequest request, HttpContext context, AuthService service,
            CancellationToken ct) => await StartSessionAsync(context, await service.VerifyLoginAsync(request, ct)))
            .RequireRateLimiting(AuthOptions.RateLimitPolicy);

        group.MapGet("/me", async (HttpContext context) =>
        {
            var account = context.GetRequiredAccount();
            var auth = await context.AuthenticateAsync();
            return Results.Ok(new SessionDto(account.User, auth.Properties?.ExpiresUtc));
        }).RequireAuthorization();

        group.MapPost("/logout", async (HttpContext context) =>
        {
            await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.Ok(new MessageResponse("Đã đăng xuất."));
        });

        MapVerificationEndpoints(group);
        MapGoogleEndpoints(group);
        MapAccountEndpoints(app);
    }

    private static void MapAccountEndpoints(IEndpointRouteBuilder app)
    {
        var account = app.MapGroup("/api/account").WithTags("Account")
            .RequireAuthorization().AddEndpointFilter<AntiforgeryFilter>();
        // Saved once, then reused for every booking so the customer never retypes it at checkout.
        account.MapPost("/phone", async (UpdatePhoneRequest request, HttpContext context, AuthService service,
            CancellationToken ct) => Results.Ok(await service.UpdatePhoneAsync(context.GetRequiredUserId(), request, ct)))
            .RequireRateLimiting(AuthOptions.RateLimitPolicy);
    }

    private static void MapVerificationEndpoints(RouteGroupBuilder group)
    {
        // A correct code proves the user owns the address they registered with, so they are signed in at once.
        group.MapPost("/verify-email", async (VerifyEmailRequest request, HttpContext context,
            EmailVerificationService service, CancellationToken ct) =>
            await StartSessionAsync(context, await service.VerifyAsync(request, ct)))
            .RequireRateLimiting(AuthOptions.RateLimitPolicy);

        group.MapPost("/resend-verification", async (ResendVerificationRequest request,
            EmailVerificationService service, CancellationToken ct) =>
        {
            await service.ResendAsync(request, ct);
            return Results.Ok(new MessageResponse(
                "Nếu email đã đăng ký và chưa xác nhận, SàiHành vừa gửi mã mới. Hãy kiểm tra cả mục Spam."));
        }).RequireRateLimiting(AuthOptions.RateLimitPolicy);
    }

    private static void MapGoogleEndpoints(RouteGroupBuilder group)
    {
        // The browser needs the public Client ID to render Google's button; null hides the button.
        group.MapGet("/google/config", (IOptions<GoogleOptions> options) =>
            Results.Ok(new GoogleConfigDto(options.Value.IsConfigured ? options.Value.ClientId : null)));

        group.MapPost("/google", async (GoogleSignInRequest request, HttpContext context,
            GoogleSignInService service, CancellationToken ct) =>
            await StartSessionAsync(context, await service.SignInAsync(request, ct)))
            .RequireRateLimiting(AuthOptions.RateLimitPolicy);
    }

    private static async Task<IResult> StartSessionAsync(HttpContext context, Account account)
    {
        // Replace any previous session instead of leaving an old ticket active.
        await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        var expiresAt = DateTimeOffset.UtcNow.Add(AuthOptions.SessionLifetime);
        Claim[] claims =
        [
            new(ClaimTypes.NameIdentifier, account.User.Id),
            new(AuthOptions.PasswordStampClaim, account.CredentialStamp),
        ];
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = false, ExpiresUtc = expiresAt });
        return Results.Ok(new SessionDto(account.User, expiresAt));
    }
}
