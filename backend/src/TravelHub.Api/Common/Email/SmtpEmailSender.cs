using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using TravelHub.Api.Configuration;

namespace TravelHub.Api.Common.Email;

public sealed record EmailMessage(string ToAddress, string ToName, string Subject, string HtmlBody, string TextBody);

public interface IEmailSender
{
    /// <summary>Returns false when the message could not be handed to the mail server.</summary>
    Task<bool> SendAsync(EmailMessage message, CancellationToken ct);
}

/// <summary>Sends mail over SMTP with STARTTLS. Failures are logged without addresses or credentials.</summary>
public sealed partial class SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private const int TimeoutMilliseconds = 20_000;

    public async Task<bool> SendAsync(EmailMessage message, CancellationToken ct)
    {
        var settings = options.Value;
        if (!settings.IsConfigured)
        {
            logger.LogWarning("Email is not configured (section Email); message was not sent.");
            return false;
        }
        using var mail = BuildMail(settings, message);
        using var client = new SmtpClient(settings.Host, settings.Port)
        {
            EnableSsl = true,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Credentials = new NetworkCredential(settings.Username, settings.Password),
            Timeout = TimeoutMilliseconds,
        };
        try
        {
            await client.SendMailAsync(mail, ct);
            return true;
        }
        catch (SmtpException ex)
        {
            // The server reply (e.g. "535 5.7.8 Username and Password not accepted") is what explains the failure.
            // It never contains the password; any email address in it is masked before logging.
            logger.LogWarning(
                "SMTP send failed. Status={SmtpStatus}, Server={ServerReply}, Cause={Cause}: {CauseReply}", ex.StatusCode, MaskEmails(ex.Message), ex.InnerException?.GetType().Name,
                MaskEmails(ex.InnerException?.Message));
            return false;
        }
    }

    private static string? MaskEmails(string? text) =>
        text is null ? null : EmailPattern().Replace(text, "***@***");

    [System.Text.RegularExpressions.GeneratedRegex(@"[\w.+-]+@[\w-]+(\.[\w-]+)+")]
    private static partial System.Text.RegularExpressions.Regex EmailPattern();

    private static MailMessage BuildMail(EmailOptions settings, EmailMessage message)
    {
        var mail = new MailMessage
        {
            From = new MailAddress(settings.Sender, settings.FromName),
            Subject = message.Subject,
            Body = message.TextBody,
            IsBodyHtml = false,
        };
        mail.To.Add(new MailAddress(message.ToAddress, message.ToName));
        mail.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(message.HtmlBody, null, "text/html"));
        return mail;
    }
}
