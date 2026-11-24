using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Assistant;

public static class AssistantEndpoints
{
    public const string RateLimitPolicy = "assistant-chat";

    /// <summary>Open to guests too: it only reads public tours and pages. CSRF header as every other POST.</summary>
    public static void MapAssistantEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/assistant/chat", async (AssistantChatRequest request, AssistantService service,
                CancellationToken ct) =>
                Results.Ok(new ItemResponse<AssistantReplyDto>(await service.ChatAsync(request, ct))))
            .WithTags("Assistant")
            .AddEndpointFilter<AntiforgeryFilter>()
            .RequireRateLimiting(RateLimitPolicy);
    }
}
