using TravelHub.Api.Api;
using TravelHub.Api.Configuration;
using TravelHub.Api.Data;
using TravelHub.Api.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
// Keep logs in the terminal; Windows EventLog may require elevated OS permissions.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Services.Configure<DatabaseOptions>(builder.Configuration.GetSection("Database"));
builder.Services.AddSingleton<MySqlConnectionFactory>();
builder.Services.AddScoped<TravelRepository>();
builder.Services.AddScoped<AuthRepository>();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<MemoryTicketStore>();
builder.Services.AddSingleton<IPasswordHasher<string>, PasswordHasher<string>>();
builder.Services.Configure<PasswordHasherOptions>(options => options.IterationCount = 210_000);
builder.Services.AddSingleton<DummyPasswordHash>();
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-Token";
    options.Cookie.Name = "SaiHanh.Csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
});
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options =>
{
    options.Cookie.Name = "SaiHanh.Session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = false;
    options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return Task.CompletedTask; };
    options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = 403; return Task.CompletedTask; };
    options.Events.OnValidatePrincipal = async context =>
    {
        var id = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
        var repository = context.HttpContext.RequestServices.GetRequiredService<AuthRepository>();
        var account = id is null ? null : await repository.FindByIdAsync(id, context.HttpContext.RequestAborted);
        if (account?.Status != "active" || account.PasswordHash is null ||
            context.Principal?.FindFirstValue("password_stamp") != AuthEndpoints.PasswordStamp(account.PasswordHash))
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }
        else
        {
            // Share only within this request; every new request still validates against MySQL.
            context.HttpContext.Items[typeof(Account)] = account;
        }
    };
});
builder.Services.AddOptions<CookieAuthenticationOptions>(CookieAuthenticationDefaults.AuthenticationScheme)
    .Configure<MemoryTicketStore>((options, store) => options.SessionStore = store);
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.AddCors(options => options.AddPolicy("NextJs", policy =>
    policy.WithOrigins("http://localhost:3000").WithMethods("GET").AllowAnyHeader()));

var app = builder.Build();
app.UseCors("NextJs");
app.UseMiddleware<ApiErrorMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
// Local HTTP profile is supported; the database connection always uses VerifyFull TLS.
app.MapTravelEndpoints();
app.MapAuthEndpoints();
app.Run();
