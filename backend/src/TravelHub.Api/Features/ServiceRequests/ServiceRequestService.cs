using TravelHub.Api.Common.Time;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.ServiceRequests;

/// <summary>Public consultation requests ("Gửi yêu cầu tư vấn"); no sign-in needed.</summary>
public sealed class ServiceRequestService(
    ServiceRequestRepository repository,
    VietnamClock clock,
    ILogger<ServiceRequestService> logger)
{
    private const int MaxCodeAttempts = 3;

    /// <summary>A filled honeypot field means a bot: people never see that input.</summary>
    public static bool IsSpam(CreateServiceRequestRequest request) => !string.IsNullOrWhiteSpace(request.Website);

    public async Task<ServiceRequestCreatedDto> CreateAsync(CreateServiceRequestRequest request, CancellationToken ct)
    {
        var now = clock.UtcNow;
        // Checked before validation and answered like a success, so a bot learns nothing and nothing is stored.
        if (IsSpam(request))
        {
            logger.LogInformation("Service request dropped by honeypot");
            return new ServiceRequestCreatedDto(NewCode(), request.ServiceType?.Trim().ToLowerInvariant() ?? "", now);
        }

        var valid = ServiceRequestValidator.Create(request, clock.Today);
        for (var attempt = 0; attempt < MaxCodeAttempts; attempt++)
        {
            var code = NewCode();
            if (!await repository.TryInsertAsync(valid, code, now, ct)) continue;
            logger.LogInformation("Service request {Code} ({Type}) received", code, valid.ServiceType);
            return new ServiceRequestCreatedDto(code, valid.ServiceType, now);
        }
        throw new InvalidOperationException("Could not generate a unique service request code.");
    }

    private string NewCode() => BookingCodeGenerator.Create(ServiceRequestLimits.CodePrefix, clock.Today);
}
