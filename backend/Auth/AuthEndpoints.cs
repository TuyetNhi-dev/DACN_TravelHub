using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using MySqlConnector;

namespace TravelHub.Api.Auth;

public sealed record RegisterRequest(string? FullName, string? Email, string? Phone, string? Password, string? ConfirmPassword);
public sealed record LoginRequest(string? Email, string? Password);

public static partial class AuthEndpoints
{
    public static string PasswordStamp(string hash) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hash)));

    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");
        group.AddEndpointFilter(async (context, next) =>
        {
            context.HttpContext.Response.Headers.CacheControl = "no-store";
            if (HttpMethods.IsPost(context.HttpContext.Request.Method))
            {
                try { await context.HttpContext.RequestServices.GetRequiredService<IAntiforgery>().ValidateRequestAsync(context.HttpContext); }
                catch (AntiforgeryValidationException) { return Results.BadRequest(new { message = "Phiên biểu mẫu đã hết hạn. Vui lòng thử lại." }); }
            }
            return await next(context);
        });
        group.MapGet("/csrf", (HttpContext context, IAntiforgery antiforgery) =>
            Results.Ok(new { token = antiforgery.GetAndStoreTokens(context).RequestToken }));

        group.MapPost("/register", async (RegisterRequest request, AuthRepository repository, IPasswordHasher<string> hasher, CancellationToken ct) =>
        {
            var errors = ValidateRegistration(request);
            if (errors.Count != 0) return Results.ValidationProblem(errors);
            var email = request.Email!.Trim().ToLowerInvariant();
            try
            {
                await repository.RegisterAsync(request.FullName!.Trim(), email, request.Phone!.Trim(),
                    hasher.HashPassword(email, request.Password!), ct);
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            { return Results.Conflict(new { message = "Email đã được sử dụng." }); }
            return Results.Ok(new { message = "Đăng ký thành công. Bạn có thể đăng nhập." });
        }).RequireRateLimiting("auth");

        group.MapPost("/login", async (LoginRequest request, HttpContext context, AuthRepository repository, IPasswordHasher<string> hasher, CancellationToken ct) =>
        {
            if (!ValidEmail(request.Email) || string.IsNullOrEmpty(request.Password) || request.Password.Length > 128)
                return Results.BadRequest(new { message = "Vui lòng nhập email và mật khẩu hợp lệ." });
            var account = await repository.FindByEmailAsync(request.Email!.Trim().ToLowerInvariant(), ct);
            // A dummy hash also makes missing accounts pay the password verification cost.
            var hash = account?.PasswordHash ?? context.RequestServices.GetRequiredService<DummyPasswordHash>().Value;
            PasswordVerificationResult verified;
            try { verified = hasher.VerifyHashedPassword(request.Email!, hash, request.Password); }
            catch (FormatException) { verified = PasswordVerificationResult.Failed; }
            if (account is null || account.PasswordHash is null || account.Status != "active" || verified == PasswordVerificationResult.Failed)
                return Results.Json(new { message = "Email hoặc mật khẩu không đúng, hoặc tài khoản chưa hoạt động." }, statusCode: 401);
            // Replace any previous session instead of leaving an old ticket active.
            await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, account.User.Id),
                new Claim("password_stamp", PasswordStamp(account.PasswordHash)) };
            await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)),
                new AuthenticationProperties { IsPersistent = false, ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8) });
            return Results.Ok(new { user = account.User });
        }).RequireRateLimiting("auth");

        group.MapGet("/me", async (HttpContext context) =>
        {
            var account = context.Items[typeof(Account)] as Account;
            if (account is null) return Results.Unauthorized();
            var auth = await context.AuthenticateAsync();
            return Results.Ok(new { user = account.User, expiresAt = auth.Properties?.ExpiresUtc });
        }).RequireAuthorization();

        group.MapPost("/logout", async (HttpContext context) =>
        {
            await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.Ok(new { message = "Đã đăng xuất." });
        });
    }

    private static bool ValidEmail(string? value) => !string.IsNullOrWhiteSpace(value) && value.Trim().Length <= 254 && new EmailAddressAttribute().IsValid(value.Trim());
    private static Dictionary<string, string[]> ValidateRegistration(RegisterRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length is < 2 or > 160)
            errors["fullName"] = ["Họ tên cần từ 2 đến 160 ký tự."];
        if (!ValidEmail(request.Email)) errors["email"] = ["Email không hợp lệ."];
        if (string.IsNullOrWhiteSpace(request.Phone) || !PhonePattern().IsMatch(request.Phone.Trim()))
            errors["phone"] = ["Số điện thoại cần 9–15 chữ số, có thể bắt đầu bằng +."];
        if (request.Password is null || request.Password.Length is < 12 or > 128)
            errors["password"] = ["Mật khẩu cần từ 12 đến 128 ký tự."];
        if (request.Password != request.ConfirmPassword) errors["confirmPassword"] = ["Mật khẩu xác nhận không khớp."];
        return errors;
    }
    [GeneratedRegex(@"^\+?[0-9]{9,15}$")]
    private static partial Regex PhonePattern();
}

public sealed class DummyPasswordHash(IPasswordHasher<string> hasher)
{
    public string Value { get; } = hasher.HashPassword("", Convert.ToHexString(RandomNumberGenerator.GetBytes(32)));
}
