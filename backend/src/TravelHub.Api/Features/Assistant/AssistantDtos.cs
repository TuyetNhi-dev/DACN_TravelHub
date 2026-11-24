using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Features.Assistant;

/// <summary>An earlier line of the conversation, kept by the browser (nothing is stored on the server).</summary>
public sealed record AssistantHistoryItem(string? Role, string? Text);

public sealed record AssistantChatRequest(string? Message, IReadOnlyList<AssistantHistoryItem>? History);

/// <summary>A site page the answer drew on (help, policy or travel guide anchor).</summary>
public sealed record AssistantSourceDto(string Title, string Url);

/// <summary>
/// POST /api/assistant/chat. Reply is the model's plain text; Tours come straight from the tour search the model
/// asked for, so every price, date and duration shown on a card is catalogue data, never model text.
/// </summary>
public sealed record AssistantReplyDto(string Reply, IReadOnlyList<TourSummaryDto> Tours,
    IReadOnlyList<AssistantSourceDto> Sources);
