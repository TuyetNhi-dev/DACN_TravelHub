namespace TravelHub.Api.Configuration;

/// <summary>
/// "Continue with Google" (section "Google"). Only the OAuth Web Client ID is needed: the browser obtains an
/// ID token from Google and the backend checks its signature and that it was issued for this Client ID.
/// The Client ID is not secret, but it is still kept out of appsettings so each environment sets its own.
/// </summary>
public sealed class GoogleOptions
{
    public string ClientId { get; set; } = "";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ClientId);
}
