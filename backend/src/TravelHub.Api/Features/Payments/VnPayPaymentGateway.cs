using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Payments;

/// <summary>
/// VNPAY Payment Gateway 2.1.0.
/// Signature: params sorted StringComparer.Ordinal, WebUtility.UrlEncode on both key and value,
/// joined as "key=value&amp;…", then HMAC-SHA512 (UTF-8) → lowercase hex. See VNPAY docs §4.
/// </summary>
public sealed class VnPayPaymentGateway(IOptions<VnPayOptions> options) : IPaymentGateway
{
    // Same timezone ID used by VietnamClock.
    private static readonly TimeZoneInfo VietnamTz =
        TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

    /// <summary>Problem "code" returned when VNPAY is called without TmnCode/HashSecret configured.</summary>
    public const string NotConfiguredCode = "vnpay_not_configured";
    private const string NotConfiguredMessage = "Thanh toán VNPAY chưa được cấu hình. Vui lòng dùng thanh toán mô phỏng.";

    public string ProviderKey => PaymentProvider.VnPay;

    public GatewayInitResult CreatePaymentUrl(CreatePaymentUrlRequest request)
    {
        var opts = options.Value;
        // Checked per call, not at startup: without secrets only simulated payment works.
        if (!opts.IsConfigured)
            throw new ApiException(StatusCodes.Status503ServiceUnavailable, NotConfiguredMessage, NotConfiguredCode);
        var txnRef = TxnRef(request.BookingCode, request.AttemptNumber);
        var createDate = ToVnDateTime(request.NowUtc);
        var expireDate = ToVnDateTime(request.HoldExpiresAtUtc);

        // SortedDictionary with Ordinal comparer ensures correct key order on iteration.
        var p = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Amount"]      = (request.AmountVnd * 100).ToString(),
            ["vnp_Command"]     = "pay",
            ["vnp_CreateDate"]  = createDate,
            ["vnp_CurrCode"]    = "VND",
            ["vnp_ExpireDate"]  = expireDate,
            ["vnp_IpAddr"]      = request.ClientIpAddress,
            ["vnp_Locale"]      = "vn",
            ["vnp_OrderInfo"]   = request.OrderInfo,
            ["vnp_OrderType"]   = "other",
            ["vnp_ReturnUrl"]   = opts.ReturnUrl,
            ["vnp_TmnCode"]     = opts.TmnCode,
            ["vnp_TxnRef"]      = txnRef,
            ["vnp_Version"]     = "2.1.0",
        };

        var hashString = BuildHashString(p);
        var hash = ComputeHmacSha512(opts.HashSecret, hashString);
        var redirectUrl = opts.BaseUrl + "?" + hashString + "&vnp_SecureHash=" + hash;
        return new GatewayInitResult(RequiresRedirect: true, RedirectUrl: redirectUrl);
    }

    public GatewayVerifyResult VerifyCallback(IReadOnlyDictionary<string, string> callbackParams)
    {
        // Never verify with an empty key: anyone could compute that signature.
        if (!options.Value.IsConfigured)
            return Fail(GetParam(callbackParams, "vnp_TransactionNo"), GetParam(callbackParams, "vnp_TxnRef"),
                ParseAmount(callbackParams), "VNPAY chưa được cấu hình.");
        if (!callbackParams.TryGetValue("vnp_SecureHash", out var receivedHash))
            return Fail("", "", 0, "vnp_SecureHash vắng mặt.");

        var filtered = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var (k, v) in callbackParams)
            if (k != "vnp_SecureHash" && k != "vnp_SecureHashType")
                filtered[k] = v;

        var expectedHash = ComputeHmacSha512(options.Value.HashSecret, BuildHashString(filtered));

        // Constant-time comparison to prevent timing attacks.
        var expectedBytes = Encoding.ASCII.GetBytes(expectedHash);
        var receivedBytes = Encoding.ASCII.GetBytes(receivedHash.ToLower());
        if (expectedBytes.Length != receivedBytes.Length ||
            !CryptographicOperations.FixedTimeEquals(expectedBytes, receivedBytes))
            return Fail(GetParam(callbackParams, "vnp_TransactionNo"),
                GetParam(callbackParams, "vnp_TxnRef"),
                ParseAmount(callbackParams),
                "Chữ ký không hợp lệ.");

        var responseCode = GetParam(callbackParams, "vnp_ResponseCode");
        var txnStatus    = GetParam(callbackParams, "vnp_TransactionStatus");
        var txnNo        = GetParam(callbackParams, "vnp_TransactionNo");
        var txnRef       = GetParam(callbackParams, "vnp_TxnRef");
        var amountVnd    = ParseAmount(callbackParams);

        if (responseCode != "00" || txnStatus != "00")
            return new GatewayVerifyResult(false, txnNo, txnRef, amountVnd,
                responseCode, DescribeResponseCode(responseCode));

        return new GatewayVerifyResult(true, txnNo, txnRef, amountVnd, responseCode, null);
    }

    /// <summary>Extracts the booking_code from "booking_code-attempt" format.</summary>
    public static string BookingCodeFromTxnRef(string txnRef)
    {
        var i = txnRef.LastIndexOf('-');
        return i > 0 ? txnRef[..i] : txnRef;
    }

    // --- helpers ---

    internal static string TxnRef(string bookingCode, int attempt) => $"{bookingCode}-{attempt}";

    private static string BuildHashString(SortedDictionary<string, string> sorted)
        => string.Join("&", sorted.Select(p =>
            WebUtility.UrlEncode(p.Key) + "=" + WebUtility.UrlEncode(p.Value)));

    private static string ComputeHmacSha512(string secret, string data)
    {
        var key = Encoding.UTF8.GetBytes(secret);
        using var hmac = new HMACSHA512(key);
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(data))).ToLower();
    }

    private static string ToVnDateTime(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(utc, DateTimeKind.Utc), VietnamTz).ToString("yyyyMMddHHmmss");

    private static string GetParam(IReadOnlyDictionary<string, string> p, string key)
        => p.TryGetValue(key, out var v) ? v : "";

    private static long ParseAmount(IReadOnlyDictionary<string, string> p)
        => long.TryParse(GetParam(p, "vnp_Amount"), out var raw) ? raw / 100 : 0;

    private static GatewayVerifyResult Fail(string txnNo, string txnRef, long amount, string reason)
        => new(false, txnNo, txnRef, amount, "", reason);

    private static string DescribeResponseCode(string code) => code switch
    {
        "07" => "Giao dịch bị nghi ngờ (có thể đã trừ tiền, cần kiểm tra thủ công).",
        "09" => "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.",
        "10" => "Xác thực thông tin thẻ không đúng quá 3 lần.",
        "11" => "Đã hết hạn chờ thanh toán.",
        "12" => "Thẻ/Tài khoản bị khóa.",
        "13" => "Nhập sai OTP xác thực giao dịch.",
        "24" => "Khách hàng hủy giao dịch.",
        "51" => "Tài khoản không đủ số dư.",
        "65" => "Vượt hạn mức giao dịch trong ngày.",
        "75" => "Ngân hàng đang bảo trì.",
        "79" => "Nhập sai mật khẩu thanh toán quá số lần quy định.",
        "99" => "Lỗi không xác định từ VNPAY.",
        _    => $"VNPAY trả mã lỗi {code}.",
    };
}
