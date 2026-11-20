using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Payments;

namespace TravelHub.Api.Tests;

/// <summary>
/// Tests for VnPayPaymentGateway signature generation and callback verification.
/// All tests use a fake HashSecret — no real VNPAY credentials are used.
/// </summary>
public sealed class VnPaySignatureTests
{
    // Fake HashSecret — not a real key, used only for unit tests.
    private const string FakeSecret = "FAKEHASHSECRETFORTESTING123456789";
    private const string FakeTmnCode = "TESTCODE";

    private static readonly DateTime FixedNow = new(2026, 11, 20, 10, 0, 0, DateTimeKind.Utc);
    private static readonly DateTime FixedExpire = new(2026, 11, 20, 10, 10, 0, DateTimeKind.Utc);

    private static VnPayPaymentGateway CreateGateway(string? returnUrl = null) =>
        new(Options.Create(new VnPayOptions
        {
            TmnCode = FakeTmnCode,
            HashSecret = FakeSecret,
            BaseUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            ReturnUrl = returnUrl ?? "http://localhost:3000/payment/result",
        }));

    private static CreatePaymentUrlRequest MakeRequest(
        string code = "SH261120K7Q2MX", int attempt = 1, long amount = 1_990_000) =>
        new(code, attempt, amount, "Thanh toan tour SH261120K7Q2MX", FixedNow, FixedExpire, "127.0.0.1");

    // --- CreatePaymentUrl ---

    [Fact]
    public void CreatePaymentUrl_ProducesRedirectUrl()
    {
        var result = CreateGateway().CreatePaymentUrl(MakeRequest());

        Assert.True(result.RequiresRedirect);
        Assert.NotNull(result.RedirectUrl);
        Assert.StartsWith("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?", result.RedirectUrl);
        Assert.Contains("vnp_SecureHash=", result.RedirectUrl);
    }

    [Fact]
    public void CreatePaymentUrl_AmountMultipliedBy100()
    {
        var result = CreateGateway().CreatePaymentUrl(MakeRequest(amount: 1_990_000));

        Assert.Contains("vnp_Amount=199000000", result.RedirectUrl);
    }

    [Fact]
    public void CreatePaymentUrl_TxnRefCombinesCodeAndAttempt()
    {
        var result = CreateGateway().CreatePaymentUrl(MakeRequest(code: "SH001", attempt: 3));

        Assert.Contains("vnp_TxnRef=SH001-3", result.RedirectUrl);
    }

    [Fact]
    public void CreatePaymentUrl_ExpireDateConvertedToVietnamTimezone()
    {
        // FixedExpire = 2026-11-20T10:10:00Z → UTC+7 = 17:10:00 → "20261120171000"
        var result = CreateGateway().CreatePaymentUrl(MakeRequest());

        Assert.Contains("vnp_ExpireDate=20261120171000", result.RedirectUrl);
    }

    [Fact]
    public void CreatePaymentUrl_CreateDateConvertedToVietnamTimezone()
    {
        // FixedNow = 2026-11-20T10:00:00Z → UTC+7 = 17:00:00 → "20261120170000"
        var result = CreateGateway().CreatePaymentUrl(MakeRequest());

        Assert.Contains("vnp_CreateDate=20261120170000", result.RedirectUrl);
    }

    [Fact]
    public void CreatePaymentUrl_ParamsSortedOrdinalBeforeHash()
    {
        // vnp_Amount < vnp_Command in Ordinal order ('A' < 'C'), so Amount appears first.
        var result = CreateGateway().CreatePaymentUrl(MakeRequest());
        var query = QueryAfterBase(result.RedirectUrl!);
        var amountPos  = query.IndexOf("vnp_Amount=",  StringComparison.Ordinal);
        var commandPos = query.IndexOf("vnp_Command=", StringComparison.Ordinal);

        Assert.True(amountPos < commandPos, "vnp_Amount must appear before vnp_Command (Ordinal sort)");
    }

    [Fact]
    public void CreatePaymentUrl_SecureHashIsLowercaseHex128Chars()
    {
        var result = CreateGateway().CreatePaymentUrl(MakeRequest());
        var hash = ExtractSecureHash(result.RedirectUrl!);

        Assert.Equal(128, hash.Length);
        Assert.Matches("^[0-9a-f]+$", hash);
    }

    // --- VerifyCallback ---

    [Fact]
    public void VerifyCallback_ValidSignature_ReturnsSuccess()
    {
        var (gw, signed) = BuildSignedCallback();

        var result = gw.VerifyCallback(signed);

        Assert.True(result.IsSuccess);
        Assert.Equal("14596765", result.TransactionNo);
        Assert.Equal("SH261120K7Q2MX-1", result.TxnRef);
        Assert.Equal(1_990_000L, result.AmountVnd);
        Assert.Null(result.FailureReason);
    }

    [Fact]
    public void VerifyCallback_MissingSecureHash_ReturnsFail()
    {
        var (gw, p) = BuildSignedCallback();
        var noHash = new Dictionary<string, string>(p);
        noHash.Remove("vnp_SecureHash");

        Assert.False(gw.VerifyCallback(noHash).IsSuccess);
    }

    [Fact]
    public void VerifyCallback_WrongSecureHash_ReturnsFail()
    {
        var (gw, p) = BuildSignedCallback();
        var wrong = new Dictionary<string, string>(p) { ["vnp_SecureHash"] = new string('0', 128) };

        var result = gw.VerifyCallback(wrong);

        Assert.False(result.IsSuccess);
        Assert.Contains("Chữ ký", result.FailureReason);
    }

    [Fact]
    public void VerifyCallback_TamperedAmount_FailsDueToInvalidSignature()
    {
        // Changing the amount invalidates the hash, so signature check catches it.
        var (gw, p) = BuildSignedCallback();
        var tampered = new Dictionary<string, string>(p) { ["vnp_Amount"] = "9999999999" };

        var result = gw.VerifyCallback(tampered);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public void VerifyCallback_ResponseCode24_ReturnsFail()
    {
        var (gw, signed) = BuildSignedCallback(responseCode: "24", txnStatus: "02");

        var result = gw.VerifyCallback(signed);

        Assert.False(result.IsSuccess);
        Assert.Equal("24", result.ResponseCode);
        Assert.Contains("hủy giao dịch", result.FailureReason);
    }

    [Fact]
    public void VerifyCallback_ResponseCode00ButTxnStatusNot00_ReturnsFail()
    {
        // Both ResponseCode AND TransactionStatus must be "00".
        var (gw, signed) = BuildSignedCallback(responseCode: "00", txnStatus: "02");

        Assert.False(gw.VerifyCallback(signed).IsSuccess);
    }

    [Fact]
    public void VerifyCallback_UppercaseHashAccepted()
    {
        // VNPAY may send the hash in uppercase; we normalise before comparing.
        var (gw, p) = BuildSignedCallback();
        var upper = new Dictionary<string, string>(p)
        {
            ["vnp_SecureHash"] = p["vnp_SecureHash"].ToUpper(),
        };

        Assert.True(gw.VerifyCallback(upper).IsSuccess);
    }

    // --- BookingCodeFromTxnRef ---

    [Theory]
    [InlineData("SH261120K7Q2MX-1",  "SH261120K7Q2MX")]
    [InlineData("SH001-3",           "SH001")]
    [InlineData("NOHYPHEN",          "NOHYPHEN")]
    public void BookingCodeFromTxnRef_ExtractsCodeBeforeLastDash(string txnRef, string expected)
        => Assert.Equal(expected, VnPayPaymentGateway.BookingCodeFromTxnRef(txnRef));

    // --- helpers ---

    private static string QueryAfterBase(string url)
    {
        var i = url.IndexOf('?');
        return i >= 0 ? url[(i + 1)..] : url;
    }

    private static string ExtractSecureHash(string url)
    {
        var query = QueryAfterBase(url);
        const string marker = "vnp_SecureHash=";
        var idx = query.LastIndexOf(marker, StringComparison.Ordinal);
        return idx >= 0 ? query[(idx + marker.Length)..] : "";
    }

    /// <summary>
    /// Builds a set of callback params that are properly signed with FakeSecret.
    /// Mirrors the exact algorithm used by VnPayPaymentGateway so the test is a true round-trip.
    /// </summary>
    private static (VnPayPaymentGateway gw, Dictionary<string, string> signedParams)
        BuildSignedCallback(string responseCode = "00", string txnStatus = "00")
    {
        var gw = CreateGateway();

        var sorted = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Amount"]            = "199000000",
            ["vnp_BankCode"]          = "NCB",
            ["vnp_BankTranNo"]        = "VNP14596765",
            ["vnp_CardType"]          = "ATM",
            ["vnp_OrderInfo"]         = "Thanh toan tour SH261120K7Q2MX",
            ["vnp_PayDate"]           = "20261120171500",
            ["vnp_ResponseCode"]      = responseCode,
            ["vnp_TmnCode"]           = FakeTmnCode,
            ["vnp_TransactionNo"]     = "14596765",
            ["vnp_TransactionStatus"] = txnStatus,
            ["vnp_TxnRef"]            = "SH261120K7Q2MX-1",
        };

        var hashString = string.Join("&", sorted.Select(p =>
            WebUtility.UrlEncode(p.Key) + "=" + WebUtility.UrlEncode(p.Value)));
        var key = Encoding.UTF8.GetBytes(FakeSecret);
        using var hmac = new HMACSHA512(key);
        var hash = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(hashString))).ToLower();

        var result = new Dictionary<string, string>(sorted) { ["vnp_SecureHash"] = hash };
        return (gw, result);
    }
}
