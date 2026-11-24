using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Time;

namespace TravelHub.Api.Features.Assistant;

/// <summary>
/// One chat turn: the model may call allowed tools for at most <see cref="AssistantRules.MaxToolRounds"/> rounds, then
/// must answer in text. The whole turn shares one deadline. Nothing is stored and no account or order data is read.
/// </summary>
/// <param name="timeout">Deadline of a whole turn; tests pass a short one, the app uses AssistantRules.Timeout.</param>
public sealed class AssistantService(IAiProvider provider, AssistantToolbox toolbox, VietnamClock clock,
    ILogger<AssistantService> logger, TimeSpan? timeout = null)
{
    private readonly TimeSpan deadlineAfter = timeout ?? AssistantRules.Timeout;

    public const string UnavailableCode = "assistant_unavailable";
    public const string FallbackReply =
        "Mình chưa có câu trả lời phù hợp. Bạn thử hỏi cách khác hoặc tìm tour bằng ô tìm kiếm.";

    public async Task<AssistantReplyDto> ChatAsync(AssistantChatRequest request, CancellationToken ct)
    {
        var chat = AssistantRules.Validate(request);
        if (!provider.IsConfigured) throw Unavailable();
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(ct);
        deadline.CancelAfter(deadlineAfter);
        try
        {
            return await RunAsync(chat, deadline.Token);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            logger.LogWarning("Assistant turn timed out after {Seconds}s.", deadlineAfter.TotalSeconds);
            throw Unavailable();
        }
        catch (AiProviderException exception)
        {
            logger.LogWarning("Assistant provider failed: {Reason}", exception.Message);
            throw Unavailable();
        }
    }

    public static ApiException Unavailable() => new(StatusCodes.Status503ServiceUnavailable,
        "Trợ lý tạm không khả dụng. Bạn vẫn có thể tìm tour bằng ô tìm kiếm.", UnavailableCode);

    private async Task<AssistantReplyDto> RunAsync(ValidChat chat, CancellationToken ct)
    {
        var prompt = AssistantRules.SystemPrompt(clock.Today);
        var messages = new List<AiMessage>(chat.History) { new AiUserMessage(chat.Message) };
        var findings = new AssistantFindings();
        for (var round = 0; round < AssistantRules.MaxToolRounds; round++)
        {
            var turn = await provider.CompleteAsync(new AiRequest(prompt, messages, AssistantToolbox.Definitions), ct);
            messages.Add(new AiModelMessage(turn));
            if (turn.ToolCalls.Count == 0) return Reply(turn.Text, findings);
            await RunToolsAsync(turn.ToolCalls, messages, findings, ct);
        }
        // Out of tool rounds: one last call without tools, so the model has to answer with what it found.
        var final = await provider.CompleteAsync(new AiRequest(prompt, messages, []), ct);
        return Reply(final.Text, findings);
    }

    private async Task RunToolsAsync(IReadOnlyList<AiToolCall> calls, List<AiMessage> messages,
        AssistantFindings findings, CancellationToken ct)
    {
        foreach (var (call, index) in calls.Select((call, index) => (call, index)))
        {
            // Every call gets an answer (providers expect one per call); extra calls are refused, not run.
            var result = index < AssistantRules.MaxToolCallsPerRound
                ? await toolbox.ExecuteAsync(call, findings, ct)
                : AssistantToolbox.Error("Quá nhiều lời gọi công cụ trong một lượt.");
            messages.Add(new AiToolResultMessage(call, result));
        }
    }

    private static AssistantReplyDto Reply(string text, AssistantFindings findings) =>
        new(string.IsNullOrWhiteSpace(text) ? FallbackReply : AssistantRules.PlainText(text), findings.Tours,
            findings.Sources);
}
