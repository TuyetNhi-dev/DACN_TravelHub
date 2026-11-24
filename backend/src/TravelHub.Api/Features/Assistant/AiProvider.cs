using System.Text.Json;

namespace TravelHub.Api.Features.Assistant;

/// <summary>A tool the model may call; Parameters is a JSON schema object.</summary>
public sealed record AiToolDefinition(string Name, string Description, JsonElement Parameters);

/// <summary>A tool call the model asked for. Id is echoed back with the result when the provider sets one.</summary>
public sealed record AiToolCall(string Name, JsonElement Arguments, string? Id);

/// <summary>
/// One model answer: text, tool calls, or both. ProviderContent is the provider's own copy of the turn, sent back
/// unchanged on the next request (Gemini attaches signatures to it that must survive the round trip).
/// </summary>
public sealed record AiModelTurn(string Text, IReadOnlyList<AiToolCall> ToolCalls, JsonElement? ProviderContent);

/// <summary>Conversation history in provider-neutral form.</summary>
public abstract record AiMessage;

public sealed record AiUserMessage(string Text) : AiMessage;

public sealed record AiModelMessage(AiModelTurn Turn) : AiMessage;

public sealed record AiToolResultMessage(AiToolCall Call, JsonElement Result) : AiMessage;

/// <summary>Tools is empty for the final call that must answer in text.</summary>
public sealed record AiRequest(string SystemPrompt, IReadOnlyList<AiMessage> Messages,
    IReadOnlyList<AiToolDefinition> Tools);

/// <summary>The model service behind the assistant. One adapter today (Gemini); others plug in here.</summary>
public interface IAiProvider
{
    bool IsConfigured { get; }

    /// <exception cref="AiProviderException">The provider refused, failed or answered something unusable.</exception>
    Task<AiModelTurn> CompleteAsync(AiRequest request, CancellationToken ct);
}

/// <summary>Any provider failure. The message is for logs only and must never contain the key or the prompt.</summary>
public sealed class AiProviderException(string message, Exception? inner = null) : Exception(message, inner);
