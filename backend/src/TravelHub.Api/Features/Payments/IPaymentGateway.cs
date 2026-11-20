namespace TravelHub.Api.Features.Payments;

/// <summary>
/// Abstracts payment provider differences so BookingPaymentService does not need to know
/// whether it is talking to VNPAY sandbox or the simulated backend.
/// </summary>
public interface IPaymentGateway
{
    /// <summary>"simulated" or "vnpay" — stored in payments.provider.</summary>
    string ProviderKey { get; }

    /// <summary>
    /// Builds a redirect URL (VNPAY) or signals inline processing (Simulated).
    /// Pure computation, no I/O.
    /// </summary>
    GatewayInitResult CreatePaymentUrl(CreatePaymentUrlRequest request);

    /// <summary>
    /// Verifies HMAC-SHA512 signature and parses the callback params sent by VNPAY
    /// on IPN or ReturnUrl. Not called for the Simulated gateway.
    /// </summary>
    GatewayVerifyResult VerifyCallback(IReadOnlyDictionary<string, string> callbackParams);
}

/// <param name="BookingCode">booking_code, used as the base of vnp_TxnRef.</param>
/// <param name="AttemptNumber">1-based counter; makes vnp_TxnRef unique across retries.</param>
/// <param name="AmountVnd">Amount in VND (gateway multiplies ×100 for VNPAY).</param>
/// <param name="OrderInfo">ASCII-only, no diacritics, no special characters.</param>
/// <param name="NowUtc">Current UTC time for vnp_CreateDate.</param>
/// <param name="HoldExpiresAtUtc">Tour hold deadline for vnp_ExpireDate.</param>
/// <param name="ClientIpAddress">Customer IP for vnp_IpAddr.</param>
public sealed record CreatePaymentUrlRequest(
    string BookingCode,
    int AttemptNumber,
    long AmountVnd,
    string OrderInfo,
    DateTime NowUtc,
    DateTime HoldExpiresAtUtc,
    string ClientIpAddress);

/// <param name="RequiresRedirect">True for VNPAY; false for Simulated (process inline).</param>
/// <param name="RedirectUrl">Non-null when RequiresRedirect is true.</param>
public sealed record GatewayInitResult(bool RequiresRedirect, string? RedirectUrl);

/// <param name="IsSuccess">True only when both vnp_ResponseCode and vnp_TransactionStatus are "00".</param>
/// <param name="TransactionNo">vnp_TransactionNo from VNPAY; stored as provider_transaction_id.</param>
/// <param name="TxnRef">vnp_TxnRef = booking_code-attempt; use BookingCodeFromTxnRef to get booking code.</param>
/// <param name="AmountVnd">vnp_Amount ÷ 100; must be verified against booking.total by the caller.</param>
/// <param name="ResponseCode">Raw vnp_ResponseCode; stored in gateway_meta for diagnosis.</param>
/// <param name="FailureReason">Human-readable reason when IsSuccess is false.</param>
public sealed record GatewayVerifyResult(
    bool IsSuccess,
    string TransactionNo,
    string TxnRef,
    long AmountVnd,
    string ResponseCode,
    string? FailureReason);
