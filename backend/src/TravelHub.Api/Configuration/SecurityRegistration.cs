using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Configuration;

public static class SecurityRegistration
{
    private const int AuthRequestsPerMinute = 20;
    private const int BookingsPerMinute = 10;

    public static IServiceCollection AddTravelHubSecurity(this IServiceCollection services, IHostEnvironment env)
    {
        // Plain HTTP is allowed only for local development; everywhere else cookies require HTTPS.
        var securePolicy = env.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
        services.AddSingleton<IPasswordHasher<string>, PasswordHasher<string>>();
        services.Configure<PasswordHasherOptions>(o => o.IterationCount = AuthOptions.PasswordHashIterations);
        services.AddSingleton<DummyPasswordHash>();
        services.AddMemoryCache();
        services.AddSingleton<MemoryTicketStore>();
        services.AddAntiforgery(options =>
        {
            options.HeaderName = AuthOptions.CsrfHeader;
            options.Cookie.Name = AuthOptions.CsrfCookie;
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.Cookie.SecurePolicy = securePolicy;
        });
        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options => ConfigureCookie(options, securePolicy));
        services.AddOptions<CookieAuthenticationOptions>(CookieAuthenticationDefaults.AuthenticationScheme)
            .Configure<MemoryTicketStore>((options, store) => options.SessionStore = store);
        services.AddAuthorization();
        services.AddRateLimiter(ConfigureRateLimits);
        return services;
    }

    private static void ConfigureCookie(CookieAuthenticationOptions options, CookieSecurePolicy securePolicy)
    {
        options.Cookie.Name = AuthOptions.SessionCookie;
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = securePolicy;
        options.ExpireTimeSpan = AuthOptions.SessionLifetime;
        options.SlidingExpiration = false;
        // An API answers with problem JSON instead of redirecting to a login page.
        options.Events.OnRedirectToLogin = context => WriteProblemAsync(context.HttpContext,
            StatusCodes.Status401Unauthorized, "Vui lòng đăng nhập để tiếp tục.");
        options.Events.OnRedirectToAccessDenied = context => WriteProblemAsync(context.HttpContext,
            StatusCodes.Status403Forbidden, "Bạn không có quyền thực hiện thao tác này.");
        options.Events.OnValidatePrincipal = SessionValidator.ValidateAsync;
    }

    private static void ConfigureRateLimits(Microsoft.AspNetCore.RateLimiting.RateLimiterOptions options)
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.OnRejected = (context, _) => new ValueTask(WriteProblemAsync(context.HttpContext,
            StatusCodes.Status429TooManyRequests, "Bạn thao tác quá nhanh. Vui lòng chờ một phút rồi thử lại."));
        options.AddPolicy(AuthOptions.RateLimitPolicy, context => FixedWindow(ClientIp(context), AuthRequestsPerMinute));
        options.AddPolicy(BookingEndpoints.CreateRateLimitPolicy, context => FixedWindow(
            context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? ClientIp(context), BookingsPerMinute));
    }

    private static RateLimitPartition<string> FixedWindow(string key, int permits) =>
        RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permits,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        });

    private static string ClientIp(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static Task WriteProblemAsync(HttpContext context, int status, string detail) =>
        Results.Problem(statusCode: status, title: ProblemTitles.For(status), detail: detail,
            extensions: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier })
            .ExecuteAsync(context);
}
