using System.Net.Http.Headers;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TravelHub.Api.Configuration;

namespace TravelHub.Api.Features.Assistant;

/// <summary>
/// Google Gemini generateContent over HTTPS. The key travels in the x-goog-api-key header, never in the URL, so it
/// cannot leak into access logs. Only the status code and Google's error status are logged, never bodies.
/// </summary>
public sealed class GeminiProvider(HttpClient http, IOptions<AiOptions> options, ILogger<GeminiProvider> logger)
    : IAiProvider
{
    public static readonly Uri BaseAddress = new("https://generativelanguage.googleapis.com/");
    public const string KeyHeader = "x-goog-api-key";
    // Vietnamese text unescaped: fewer tokens. Safe here: the body goes to the API, never into an HTML page.
    private static readonly JsonSerializerOptions RequestJson =
        new() { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
    /// <summary>The free tier often answers 503 "overloaded" for a moment; one quick retry usually works.</summary>
    public static readonly TimeSpan RetryDelay = TimeSpan.FromMilliseconds(400);

    public bool IsConfigured => options.Value.IsConfigured;

    /// <summary>
    /// One retry on a transient 500/503, inside the caller's deadline. 429 (quota) is not retried: it would only use
    /// more of the quota.
    /// </summary>
    public async Task<AiModelTurn> CompleteAsync(AiRequest request, CancellationToken ct)
    {
        if (!IsConfigured) throw new AiProviderException("Gemini is not configured.");
        try
        {
            return await SendOnceAsync(request, ct);
        }
        catch (TransientGeminiException)
        {
            await Task.Delay(RetryDelay, ct);
            try
            {
                return await SendOnceAsync(request, ct);
            }
            catch (TransientGeminiException exception)
            {
                throw new AiProviderException(exception.Message, exception);
            }
        }
    }

    private async Task<AiModelTurn> SendOnceAsync(AiRequest request, CancellationToken ct)
    {
        using var message = BuildRequest(request);
        HttpResponseMessage response;
        try
        {
            response = await http.SendAsync(message, ct);
        }
        catch (HttpRequestException exception)
        {
            throw new AiProviderException("Gemini could not be reached.", exception);
        }
        using (response)
        {
            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var document = await ReadJsonAsync(stream, ct);
            if (!response.IsSuccessStatusCode)
            {
                var status = (int)response.StatusCode;
                logger.LogWarning("Gemini request failed. Status={Status}, ErrorStatus={ErrorStatus}", status,
                    ErrorStatus(document));
                var reason = $"Gemini answered HTTP {status}.";
                throw status is StatusCodes.Status500InternalServerError or StatusCodes.Status503ServiceUnavailable
                    ? new TransientGeminiException(reason)
                    : new AiProviderException(reason);
            }
            return GeminiPayload.Parse(document?.RootElement
                ?? throw new AiProviderException("Gemini answered a body that is not JSON."));
        }
    }

    private HttpRequestMessage BuildRequest(AiRequest request)
    {
        var settings = options.Value;
        var body = GeminiPayload.Build(request, settings.GeminiThinkingLevel).ToJsonString(RequestJson);
        var message = new HttpRequestMessage(HttpMethod.Post, $"v1beta/models/{settings.GeminiModel}:generateContent")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };
        message.Headers.Add(KeyHeader, settings.GeminiApiKey);
        message.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return message;
    }

    private static async Task<JsonDocument?> ReadJsonAsync(Stream stream, CancellationToken ct)
    {
        try
        {
            return await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>Google's machine-readable error status (e.g. RESOURCE_EXHAUSTED); the message is not logged.</summary>
    private static string ErrorStatus(JsonDocument? document) =>
        document is not null && document.RootElement.ValueKind == JsonValueKind.Object
        && document.RootElement.TryGetProperty("error", out var error) && error.ValueKind == JsonValueKind.Object
        && error.TryGetProperty("status", out var status)
            ? status.ToString()
            : "unknown";

    /// <summary>A 500/503 worth one retry; never leaves this class (it becomes an AiProviderException).</summary>
    private sealed class TransientGeminiException(string message) : Exception(message);
}
