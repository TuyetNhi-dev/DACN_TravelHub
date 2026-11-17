using System.Text.Encodings.Web;
using TravelHub.Api.Common.Email;

namespace TravelHub.Api.Features.Auth.EmailVerification;

/// <summary>Vietnamese OTP email, as both HTML and plain text for clients that block HTML.</summary>
public static class VerificationEmail
{
    /// <summary>Page where a user who closed the sign-up form can still enter the code.</summary>
    public const string VerifyPath = "/verify-email";

    public static EmailMessage Build(string toAddress, string fullName, string code, string frontendBaseUrl)
    {
        var minutes = (int)VerificationCode.Lifetime.TotalMinutes;
        var page = frontendBaseUrl.TrimEnd('/') + VerifyPath;
        var subject = $"{code} là mã xác nhận tài khoản SàiHành";
        var text = $"""
            Xin chào {fullName},

            Mã xác nhận tài khoản SàiHành của bạn là: {code}

            Mã có hiệu lực trong {minutes} phút. Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên SàiHành.
            Nếu đã đóng trang đăng ký, bạn có thể nhập mã tại: {page}
            Nếu bạn không đăng ký, hãy bỏ qua email này.

            SàiHành
            """;
        return new EmailMessage(toAddress, fullName, subject, Html(fullName, code, minutes, page), text);
    }

    private static string Html(string fullName, string code, int minutes, string page)
    {
        var name = HtmlEncoder.Default.Encode(fullName);
        var href = HtmlEncoder.Default.Encode(page);
        return $"""
            <!doctype html>
            <html lang="vi"><body style="margin:0;padding:24px;background:#f5f9fa;
              font-family:Arial,sans-serif;color:#142f3d">
            <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;
              border-radius:16px;border:1px solid #dce8ec"><tr><td style="padding:32px">
            <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#bd267e">SàiHành</p>
            <h1 style="margin:16px 0 8px;font-size:20px">Mã xác nhận tài khoản</h1>
            <p style="line-height:1.6">Xin chào {name}, nhập mã dưới đây trên trang đăng ký để kích hoạt
              tài khoản SàiHành.</p>
            <p style="margin:24px 0;padding:16px;border-radius:12px;background:#f5f9fa;text-align:center;
              font-size:34px;font-weight:800;letter-spacing:10px;color:#142f3d">{code}</p>
            <p style="font-size:13px;color:#586f7a;line-height:1.6">Mã có hiệu lực trong {minutes} phút.
              <b>Không chia sẻ mã này với bất kỳ ai</b>, kể cả nhân viên SàiHành.</p>
            <p style="font-size:13px;color:#586f7a;line-height:1.6">Đã đóng trang đăng ký? Nhập mã tại
              <a href="{href}" style="color:#0079ad">{href}</a></p>
            <p style="font-size:13px;color:#586f7a">Nếu bạn không đăng ký, hãy bỏ qua email này.</p>
            </td></tr></table></body></html>
            """;
    }
}
