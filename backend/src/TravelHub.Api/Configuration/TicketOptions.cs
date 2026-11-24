namespace TravelHub.Api.Configuration;

/// <summary>
/// Configuration section "Ticket". SigningKey signs the e-ticket QR (HMAC-SHA256). Set it with dotnet user-secrets in
/// development and an environment variable (Ticket__SigningKey) elsewhere; never commit it and never log it.
/// Changing the key voids every QR already issued.
/// </summary>
public sealed class TicketOptions
{
    public const string SectionName = "Ticket";
    /// <summary>32 characters of a random string carry at least 128 bits even from a limited alphabet.</summary>
    public const int MinKeyLength = 32;

    public string SigningKey { get; init; } = "";

    public bool IsConfigured => SigningKey.Length >= MinKeyLength;
}
