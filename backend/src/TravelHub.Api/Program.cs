using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Configuration;

var builder = WebApplication.CreateBuilder(args);
// Keep logs in the terminal; Windows EventLog may require elevated OS permissions.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddTravelHubServices(builder.Configuration);
builder.Services.AddTravelHubSecurity(builder.Environment);

var app = builder.Build();
if (!app.Services.GetRequiredService<IOptions<VnPayOptions>>().Value.IsConfigured)
    app.Logger.LogWarning("VNPAY is not configured (Vnpay:TmnCode / Vnpay:HashSecret); only simulated payment is available.");
// First, so CORS, logging and rate limits see the real client IP (trusted from loopback only).
app.UseForwardedHeaders();
app.UseCors(ServiceRegistration.FrontendCorsPolicy);
app.UseMiddleware<ApiErrorMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapTravelHubEndpoints();
app.Run();
