using System.Text.Encodings.Web;
using TravelHub.Api.Common.Email;

namespace TravelHub.Api.Features.Auth.EmailVerification;

/// <summary>
/// Vietnamese OTP emails (sign-up and password reset), as HTML and as plain text for clients that block HTML.
/// </summary>
public static class VerificationEmail
{
    /// <summary>Page where a user who closed the sign-up form can still enter the code.</summary>
    public const string VerifyPath = "/verify-email";
    /// <summary>Page of the "Quên mật khẩu" flow.</summary>
    public const string ResetPasswordPath = "/quen-mat-khau";

    /// <summary>Wording that differs between the two emails; the layout and the safety notes are shared.</summary>
    private sealed record OtpCopy(string Subject, string Title, string Intro, string Path, string PageHint,
        string IgnoreNote);

    private static readonly OtpCopy SignUp = new("là mã xác nhận tài khoản SàiHành", "Mã xác nhận tài khoản",
        "nhập mã dưới đây trên trang đăng ký để kích hoạt tài khoản SàiHành.", VerifyPath,
        "Đã đóng trang đăng ký? Nhập mã tại", "Nếu bạn không đăng ký, hãy bỏ qua email này.");

    private static readonly OtpCopy PasswordReset = new("là mã đặt lại mật khẩu SàiHành", "Mã đặt lại mật khẩu",
        "nhập mã dưới đây để đặt mật khẩu mới cho tài khoản SàiHành.", ResetPasswordPath,
        "Đã đóng trang? Mở lại tại", "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này; "
        + "mật khẩu hiện tại vẫn giữ nguyên.");

    public static EmailMessage Build(string toAddress, string fullName, string code, string frontendBaseUrl) =>
        Compose(SignUp, toAddress, fullName, code, frontendBaseUrl);

    public static EmailMessage BuildPasswordReset(string toAddress, string fullName, string code,
        string frontendBaseUrl) => Compose(PasswordReset, toAddress, fullName, code, frontendBaseUrl);

    private static EmailMessage Compose(OtpCopy copy, string toAddress, string fullName, string code,
        string frontendBaseUrl)
    {
        var minutes = (int)VerificationCode.Lifetime.TotalMinutes;
        var page = frontendBaseUrl.TrimEnd('/') + copy.Path;
        var text = $"""
            Xin chào {fullName},

            {copy.Title} của bạn là: {code}

            Mã có hiệu lực trong {minutes} phút. Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên SàiHành.
            {copy.PageHint}: {page}
            {copy.IgnoreNote}

            SàiHành
            """;
        var html = Html(copy, fullName, code, minutes, page);
        return new EmailMessage(toAddress, fullName, $"{code} {copy.Subject}", html, text);
    }

    private static string Html(OtpCopy copy, string fullName, string code, int minutes, string page)
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
            <h1 style="margin:16px 0 8px;font-size:20px">{copy.Title}</h1>
            <p style="line-height:1.6">Xin chào {name}, {copy.Intro}</p>
            <p style="margin:24px 0;padding:16px;border-radius:12px;background:#f5f9fa;text-align:center;
              font-size:34px;font-weight:800;letter-spacing:10px;color:#142f3d">{code}</p>
            <p style="font-size:13px;color:#586f7a;line-height:1.6">Mã có hiệu lực trong {minutes} phút.
              <b>Không chia sẻ mã này với bất kỳ ai</b>, kể cả nhân viên SàiHành.</p>
            <p style="font-size:13px;color:#586f7a;line-height:1.6">{copy.PageHint}
              <a href="{href}" style="color:#0079ad">{href}</a></p>
            <p style="font-size:13px;color:#586f7a">{copy.IgnoreNote}</p>
            </td></tr></table></body></html>
            """;
    }
}
