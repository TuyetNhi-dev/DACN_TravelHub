namespace TravelHub.Api.Configuration;

/// <summary>
/// Configuration section "Vnpay". All sensitive values (TmnCode, HashSecret) must be set via
/// dotnet user-secrets in development and environment variables / secrets manager in production.
/// Never commit real values to source control.
/// </summary>
public sealed class VnPayOptions
{
    public const string SectionName = "Vnpay";

    /// <summary>Terminal merchant code assigned by VNPAY. Set via user-secrets.</summary>
    public string TmnCode { get; init; } = "";

    /// <summary>HMAC-SHA512 signing key. Set via user-secrets. Never log this value.</summary>
    public string HashSecret { get; init; } = "";

    /// <summary>VNPAY payment page URL. Sandbox default is safe to commit.</summary>
    public string BaseUrl { get; init; } = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    /// <summary>Frontend URL that VNPAY redirects the customer back to after payment.</summary>
    public string ReturnUrl { get; init; } = "http://localhost:3000/payment/result";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(TmnCode) && !string.IsNullOrWhiteSpace(HashSecret);
}
