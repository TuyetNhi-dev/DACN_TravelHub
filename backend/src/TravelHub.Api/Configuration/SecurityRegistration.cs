using System.Net;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Bookings;
using TravelHub.Api.Features.Cart;
using TravelHub.Api.Features.ServiceRequests;

namespace TravelHub.Api.Configuration;

public static class SecurityRegistration
{
    private const int AuthRequestsPerMinute = 20;
    private const int BookingsPerMinute = 10;
    private const int ServiceRequestsPerWindow = 5;
    // The guest cart page asks for live prices on every visit; generous, but still a cap per client IP.
    private const int CartQuotesPerMinute = 60;
    private static readonly TimeSpan ServiceRequestWindow = TimeSpan.FromMinutes(10);

    public static IServiceCollection AddTravelHubSecurity(this IServiceCollection services, IHostEnvironment env)
    {
        ConfigureForwardedHeaders(services);
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
        services.AddAuthorization(ConfigureAuthorization);
        services.AddSingleton<IAuthorizationHandler, TermsAcceptedHandler>();
        services.AddSingleton<IAuthorizationMiddlewareResultHandler, TermsAwareAuthorizationResultHandler>();
        services.AddRateLimiter(ConfigureRateLimits);
        return services;
    }

    /// <summary>
    /// Every RequireAuthorization() (bookings, cart, account, back office) needs a session AND a stored agreement to
    /// the data protection policy and terms of use. Only the endpoints used to agree or to leave ask for SignedIn.
    /// </summary>
    private static void ConfigureAuthorization(AuthorizationOptions options)
    {
        options.DefaultPolicy = new AuthorizationPolicyBuilder(CookieAuthenticationDefaults.AuthenticationScheme)
            .RequireAuthenticatedUser().AddRequirements(new TermsAcceptedRequirement()).Build();
        options.AddPolicy(AuthPolicies.SignedIn, policy => policy
            .AddAuthenticationSchemes(CookieAuthenticationDefaults.AuthenticationScheme).RequireAuthenticatedUser());
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
        options.AddPolicy(ServiceRequestEndpoints.CreateRateLimitPolicy, context => FixedWindow(
            ClientIp(context), ServiceRequestsPerWindow, ServiceRequestWindow));
        options.AddPolicy(CartEndpoints.QuoteRateLimitPolicy,
            context => FixedWindow(ClientIp(context), CartQuotesPerMinute));
    }

    /// <summary>
    /// Browsers reach the API through the Next.js proxy, so without this every client shares the proxy's IP and
    /// per-IP rate limits become one global limit. X-Forwarded-For is trusted ONLY from loopback (the Next.js
    /// server on the same machine); anyone else sending the header cannot change their apparent IP.
    /// Deploying with the proxy on another host requires adding its address to KnownProxies (ROADMAP, week 10).
    /// </summary>
    private static void ConfigureForwardedHeaders(IServiceCollection services) =>
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
            options.ForwardLimit = 1;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
            options.KnownProxies.Add(IPAddress.Loopback);
            options.KnownProxies.Add(IPAddress.IPv6Loopback);
        });

    private static RateLimitPartition<string> FixedWindow(string key, int permits, TimeSpan? window = null) =>
        RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permits,
            Window = window ?? TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        });

    private static string ClientIp(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static Task WriteProblemAsync(HttpContext context, int status, string detail) =>
        Results.Problem(statusCode: status, title: ProblemTitles.For(status), detail: detail,
            extensions: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier })
            .ExecuteAsync(context);
}
