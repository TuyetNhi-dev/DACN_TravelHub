using System.Text.RegularExpressions;

namespace TravelHub.Api.Configuration;

/// <summary>
/// Configuration section "Ai". GeminiApiKey is a secret: dotnet user-secrets in development, the environment variable
/// Ai__GeminiApiKey elsewhere. Never commit it, never log it, never put it in a URL (it travels in a header).
/// Without a key the assistant endpoint answers 503 and the rest of the site is unaffected.
/// </summary>
public sealed partial class AiOptions
{
    public const string SectionName = "Ai";
    /// <summary>Free-tier model with function calling (Google AI Studio model list, checked 24/11/2026).</summary>
    public const string DefaultGeminiModel = "gemini-3.5-flash-lite";

    public string GeminiApiKey { get; init; } = "";

    /// <summary>Model id; part of the request path, so only a plain id is accepted.</summary>
    public string GeminiModel { get; init; } = DefaultGeminiModel;

    /// <summary>
    /// generationConfig.thinkingConfig.thinkingLevel. MINIMAL keeps a turn well inside the 15-second deadline; an empty
    /// value sends no thinkingConfig (for a model without thinking).
    /// </summary>
    public string GeminiThinkingLevel { get; init; } = "MINIMAL";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(GeminiApiKey) && ModelId().IsMatch(GeminiModel);

    [GeneratedRegex("^[a-z0-9][a-z0-9.-]{0,63}$")]
    private static partial Regex ModelId();
}
