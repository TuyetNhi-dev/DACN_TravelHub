using TravelHub.Api.Common.Errors;
using TravelHub.Api.Configuration;

var builder = WebApplication.CreateBuilder(args);
// Keep logs in the terminal; Windows EventLog may require elevated OS permissions.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddTravelHubServices(builder.Configuration);
builder.Services.AddTravelHubSecurity(builder.Environment);

var app = builder.Build();
app.UseCors(ServiceRegistration.FrontendCorsPolicy);
app.UseMiddleware<ApiErrorMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapTravelHubEndpoints();
app.Run();
