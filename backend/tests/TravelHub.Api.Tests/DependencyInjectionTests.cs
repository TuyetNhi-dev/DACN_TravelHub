using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Bookings;
using TravelHub.Api.Features.Payments;

namespace TravelHub.Api.Tests;

/// <summary>
/// Builds the application's service container the way Program.cs does, with full validation, so a
/// missing registration fails here instead of crashing the API at startup. No database is touched:
/// repositories only open connections when a query runs.
/// </summary>
public class DependencyInjectionTests
{
    private static ServiceProvider BuildProvider(IDictionary<string, string?>? settings = null)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = Environments.Development,
            ApplicationName = typeof(ServiceRegistration).Assembly.GetName().Name,
        });
        // Ignore appsettings, user-secrets and environment variables of the machine running the tests.
        builder.Configuration.Sources.Clear();
        builder.Configuration.AddInMemoryCollection(settings ?? new Dictionary<string, string?>());
        builder.Services.AddTravelHubServices(builder.Configuration);
        builder.Services.AddTravelHubSecurity(builder.Environment);
        return builder.Services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true,
        });
    }

    [Fact]
    public void Container_builds_with_validation_when_vnpay_is_not_configured()
    {
        using var provider = BuildProvider();
        Assert.False(provider.GetRequiredService<IOptions<VnPayOptions>>().Value.IsConfigured);
    }

    [Fact]
    public void Every_application_service_resolves_inside_a_scope()
    {
        using var provider = BuildProvider();
        using var scope = provider.CreateScope();
        var appAssembly = typeof(ServiceRegistration).Assembly;
        var appServiceTypes = WebApplicationServiceTypes()
            .Where(type => type.Assembly == appAssembly && !type.IsGenericTypeDefinition)
            .Distinct()
            .ToList();
        Assert.Contains(typeof(BookingPaymentService), appServiceTypes);
        foreach (var type in appServiceTypes)
            Assert.NotNull(scope.ServiceProvider.GetRequiredService(type));
        Assert.NotEmpty(provider.GetServices<IHostedService>());
    }

    [Fact]
    public void Vnpay_section_binds_into_options()
    {
        using var provider = BuildProvider(new Dictionary<string, string?>
        {
            ["Vnpay:TmnCode"] = "TESTCODE",
            ["Vnpay:HashSecret"] = "test-secret",
            ["Vnpay:ReturnUrl"] = "http://localhost:3000/payment/result",
        });
        var options = provider.GetRequiredService<IOptions<VnPayOptions>>().Value;
        Assert.True(options.IsConfigured);
        Assert.Equal("TESTCODE", options.TmnCode);
    }

    [Fact]
    public void Unconfigured_vnpay_reports_not_configured_instead_of_signing_with_an_empty_key()
    {
        var gateway = new VnPayPaymentGateway(Options.Create(new VnPayOptions()));
        var request = new CreatePaymentUrlRequest("TH001", 1, 1_000_000, "Thanh toan tour TH001",
            DateTime.UtcNow, DateTime.UtcNow.AddMinutes(10), "127.0.0.1");

        var error = Assert.Throws<ApiException>(() => gateway.CreatePaymentUrl(request));
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, error.StatusCode);
        Assert.Equal(VnPayPaymentGateway.NotConfiguredCode, error.Code);

        // A callback signed with an empty secret must never verify.
        var callback = gateway.VerifyCallback(new Dictionary<string, string>
        {
            ["vnp_TxnRef"] = "TH001-1", ["vnp_ResponseCode"] = "00", ["vnp_TransactionStatus"] = "00",
            ["vnp_SecureHash"] = "anything",
        });
        Assert.False(callback.IsSuccess);
        Assert.Contains("chưa được cấu hình", callback.FailureReason);
    }

    /// <summary>Service types registered by AddTravelHubServices/AddTravelHubSecurity (concrete app classes).</summary>
    private static IEnumerable<Type> WebApplicationServiceTypes()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = Environments.Development });
        builder.Configuration.Sources.Clear();
        builder.Services.AddTravelHubServices(builder.Configuration);
        builder.Services.AddTravelHubSecurity(builder.Environment);
        return builder.Services
            .Where(descriptor => descriptor.ServiceType != typeof(IHostedService))
            .Select(descriptor => descriptor.ServiceType);
    }
}
