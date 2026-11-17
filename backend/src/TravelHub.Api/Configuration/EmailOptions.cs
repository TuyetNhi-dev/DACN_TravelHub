namespace TravelHub.Api.Configuration;

/// <summary>
/// SMTP settings (section "Email"). Username and Password come from user-secrets or environment variables,
/// never from appsettings files. For Gmail, Password is a 16-character App Password, not the account password.
/// </summary>
public sealed class EmailOptions
{
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    /// <summary>Defaults to Username; Gmail rejects a From address the account does not own.</summary>
    public string FromAddress { get; set; } = "";
    public string FromName { get; set; } = "SàiHành";
    /// <summary>Public site address used to build links inside emails.</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";

    public string Sender => string.IsNullOrWhiteSpace(FromAddress) ? Username : FromAddress;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(Username)
        && !string.IsNullOrWhiteSpace(Password);
}
