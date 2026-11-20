using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Payments;

/// <summary>
/// No-op gateway for demo / offline use. Payment is processed inline in BookingPaymentService
/// without any redirect or external call; VerifyCallback is never invoked.
/// </summary>
public sealed class SimulatedPaymentGateway : IPaymentGateway
{
    public string ProviderKey => PaymentProvider.Simulated;

    public GatewayInitResult CreatePaymentUrl(CreatePaymentUrlRequest request)
        => new(RequiresRedirect: false, RedirectUrl: null);

    public GatewayVerifyResult VerifyCallback(IReadOnlyDictionary<string, string> callbackParams)
        => throw new NotSupportedException("SimulatedPaymentGateway does not handle callbacks.");
}
