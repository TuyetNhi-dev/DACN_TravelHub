using System.Text.Json;
using System.Text.Json.Nodes;

namespace TravelHub.Api.Features.Assistant;

/// <summary>
/// Request and response bodies of Gemini generateContent (v1beta), kept pure so they are unit-tested. A model turn is
/// sent back exactly as it arrived (ProviderContent), so thought signatures on its parts are preserved.
/// </summary>
public static class GeminiPayload
{
    public const int MaxOutputTokens = 1024;
    private const string UserRole = "user";
    private const string ModelRole = "model";

    public static JsonObject Build(AiRequest request, string? thinkingLevel = null)
    {
        var generation = new JsonObject { ["maxOutputTokens"] = MaxOutputTokens };
        if (!string.IsNullOrWhiteSpace(thinkingLevel))
            generation["thinkingConfig"] = new JsonObject { ["thinkingLevel"] = thinkingLevel };
        var body = new JsonObject
        {
            ["systemInstruction"] = new JsonObject { ["parts"] = new JsonArray(TextPart(request.SystemPrompt)) },
            ["contents"] = Contents(request.Messages),
            ["generationConfig"] = generation,
        };
        if (request.Tools.Count > 0)
            body["tools"] = new JsonArray(new JsonObject { ["functionDeclarations"] = Declarations(request.Tools) });
        return body;
    }

    /// <summary>The first candidate as a model turn; anything unusable is an AiProviderException.</summary>
    public static AiModelTurn Parse(JsonElement root)
    {
        if (!root.TryGetProperty("candidates", out var candidates) || candidates.ValueKind != JsonValueKind.Array
            || candidates.GetArrayLength() == 0)
            throw new AiProviderException("Gemini returned no candidate (blocked or empty).");
        var candidate = candidates[0];
        if (!candidate.TryGetProperty("content", out var content)
            || !content.TryGetProperty("parts", out var parts) || parts.ValueKind != JsonValueKind.Array)
            throw new AiProviderException("Gemini candidate has no content; finishReason=" + FinishReason(candidate));
        var text = string.Concat(parts.EnumerateArray().Where(IsAnswerText)
            .Select(p => p.GetProperty("text").GetString()));
        var calls = parts.EnumerateArray().Where(p => p.TryGetProperty("functionCall", out _)).Select(ToCall).ToList();
        if (text.Length == 0 && calls.Count == 0)
            throw new AiProviderException("Gemini answered neither text nor a function call.");
        return new AiModelTurn(text.Trim(), calls, content.Clone());
    }

    private static JsonArray Contents(IReadOnlyList<AiMessage> messages)
    {
        var contents = new JsonArray();
        JsonArray? pendingResults = null;
        foreach (var message in messages)
        {
            if (message is AiToolResultMessage result)
            {
                // All results of one model turn go back together in a single user turn.
                pendingResults ??= new JsonArray();
                pendingResults.Add(FunctionResponse(result));
                continue;
            }
            if (pendingResults is not null) contents.Add(Turn(UserRole, pendingResults));
            pendingResults = null;
            contents.Add(message switch
            {
                AiUserMessage user => Turn(UserRole, new JsonArray(TextPart(user.Text))),
                AiModelMessage model => ModelContent(model.Turn),
                _ => throw new InvalidOperationException("Unknown message type."),
            });
        }
        if (pendingResults is not null) contents.Add(Turn(UserRole, pendingResults));
        return contents;
    }

    private static JsonNode ModelContent(AiModelTurn turn) => turn.ProviderContent is { } raw
        ? JsonNode.Parse(raw.GetRawText())!
        : Turn(ModelRole, new JsonArray(TextPart(turn.Text)));

    private static JsonObject FunctionResponse(AiToolResultMessage result)
    {
        var response = new JsonObject
        {
            ["name"] = result.Call.Name,
            ["response"] = new JsonObject { ["result"] = JsonNode.Parse(result.Result.GetRawText()) },
        };
        if (result.Call.Id is { } id) response["id"] = id;
        return new JsonObject { ["functionResponse"] = response };
    }

    private static JsonArray Declarations(IReadOnlyList<AiToolDefinition> tools) => new(tools
        .Select(tool => (JsonNode)new JsonObject
        {
            ["name"] = tool.Name,
            ["description"] = tool.Description,
            ["parameters"] = JsonNode.Parse(tool.Parameters.GetRawText()),
        }).ToArray());

    private static JsonObject Turn(string role, JsonArray parts) => new() { ["role"] = role, ["parts"] = parts };

    private static JsonObject TextPart(string text) => new() { ["text"] = text };

    // Thinking models may return their reasoning as parts flagged "thought"; only the answer is shown.
    private static bool IsAnswerText(JsonElement part) =>
        part.TryGetProperty("text", out var text) && text.ValueKind == JsonValueKind.String
        && !(part.TryGetProperty("thought", out var thought) && thought.ValueKind == JsonValueKind.True);

    private static AiToolCall ToCall(JsonElement part)
    {
        var call = part.GetProperty("functionCall");
        var name = call.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
        var args = call.TryGetProperty("args", out var a) ? a.Clone() : JsonDocument.Parse("{}").RootElement.Clone();
        var id = call.TryGetProperty("id", out var i) && i.ValueKind == JsonValueKind.String ? i.GetString() : null;
        return new AiToolCall(name, args, id);
    }

    private static string FinishReason(JsonElement candidate) =>
        candidate.TryGetProperty("finishReason", out var reason) ? reason.ToString() : "unknown";
}
