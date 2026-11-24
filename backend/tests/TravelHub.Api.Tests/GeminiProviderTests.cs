using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Assistant;

namespace TravelHub.Api.Tests;

/// <summary>Gemini request/response mapping and HTTP behaviour with a fake handler. Fake key, no network.</summary>
public sealed class GeminiProviderTests
{
    private const string FakeKey = "FAKE-GEMINI-KEY-FOR-TESTS";

    private static readonly AiToolCall SearchCall = new(AssistantToolbox.SearchTours,
        JsonSerializer.SerializeToElement(new { query = "Huế" }), "call-1");

    private static JsonElement Json(string text) => JsonDocument.Parse(text).RootElement.Clone();

    [Fact]
    public void Request_carries_system_prompt_tools_and_grouped_results_and_keeps_model_turns_verbatim()
    {
        var modelContent = Json("""
            {"role":"model","parts":[{"functionCall":{"name":"search_tours","args":{"query":"Huế"},"id":"call-1"},
              "thoughtSignature":"sig-abc"}]}
            """);
        var request = new AiRequest("Quy tắc", [
            new AiUserMessage("Tour Huế"),
            new AiModelMessage(new AiModelTurn("", [SearchCall], modelContent)),
            new AiToolResultMessage(SearchCall, Json("""{"count":0}""")),
        ], AssistantToolbox.Definitions);

        var body = Json(GeminiPayload.Build(request).ToJsonString());

        var system = body.GetProperty("systemInstruction").GetProperty("parts")[0];
        Assert.Equal("Quy tắc", system.GetProperty("text").GetString());
        var names = body.GetProperty("tools")[0].GetProperty("functionDeclarations").EnumerateArray()
            .Select(d => d.GetProperty("name").GetString());
        Assert.Equal([AssistantToolbox.SearchTours, AssistantToolbox.GetPolicy], names);
        var contents = body.GetProperty("contents");
        Assert.Equal(3, contents.GetArrayLength());
        Assert.Equal("sig-abc", contents[1].GetProperty("parts")[0].GetProperty("thoughtSignature").GetString());
        var response = contents[2].GetProperty("parts")[0].GetProperty("functionResponse");
        Assert.Equal(("user", "search_tours", "call-1"), (contents[2].GetProperty("role").GetString(),
            response.GetProperty("name").GetString(), response.GetProperty("id").GetString()));
        Assert.Equal(0, response.GetProperty("response").GetProperty("result").GetProperty("count").GetInt32());
    }

    [Fact]
    public void Final_request_without_tools_has_no_tools_field()
    {
        var body = Json(GeminiPayload.Build(new AiRequest("Quy tắc", [new AiUserMessage("Hi")], [])).ToJsonString());
        Assert.False(body.TryGetProperty("tools", out _));
        Assert.False(body.GetProperty("generationConfig").TryGetProperty("thinkingConfig", out _));
    }

    [Fact]
    public void Thinking_level_is_sent_when_configured()
    {
        var request = new AiRequest("Quy tắc", [new AiUserMessage("Hi")], []);
        var body = Json(GeminiPayload.Build(request, "MINIMAL").ToJsonString());
        Assert.Equal("MINIMAL", body.GetProperty("generationConfig").GetProperty("thinkingConfig")
            .GetProperty("thinkingLevel").GetString());
        Assert.Equal(GeminiPayload.MaxOutputTokens,
            body.GetProperty("generationConfig").GetProperty("maxOutputTokens").GetInt32());
    }

    [Fact]
    public void Response_parsing_reads_calls_and_answer_text_but_not_thoughts()
    {
        var turn = GeminiPayload.Parse(Json("""
            {"candidates":[{"content":{"role":"model","parts":[
              {"text":"suy nghĩ nội bộ","thought":true},
              {"text":"Mình tìm giúp bạn."},
              {"functionCall":{"name":"get_policy","args":{"topic":"hủy"},"id":"x"}}]}}]}
            """));
        Assert.Equal("Mình tìm giúp bạn.", turn.Text);
        var call = Assert.Single(turn.ToolCalls);
        Assert.Equal(("get_policy", "hủy", "x"), (call.Name, call.Arguments.GetProperty("topic").GetString(), call.Id));
        Assert.NotNull(turn.ProviderContent);
    }

    [Theory]
    [InlineData("""{"promptFeedback":{"blockReason":"SAFETY"}}""")]
    [InlineData("""{"candidates":[{"finishReason":"SAFETY"}]}""")]
    [InlineData("""{"candidates":[{"content":{"role":"model","parts":[]}}]}""")]
    public void Unusable_responses_are_provider_errors(string json) =>
        Assert.Throws<AiProviderException>(() => GeminiPayload.Parse(Json(json)));

    [Fact]
    public async Task Key_travels_in_the_header_never_in_the_url()
    {
        var handler = new CaptureHandler(HttpStatusCode.OK,
            """{"candidates":[{"content":{"role":"model","parts":[{"text":"Chào bạn"}]}}]}""");
        var provider = Provider(handler, new AiOptions { GeminiApiKey = FakeKey });

        var turn = await provider.CompleteAsync(new AiRequest("Quy tắc", [new AiUserMessage("Hi")], []), default);

        Assert.Equal("Chào bạn", turn.Text);
        var sent = Assert.Single(handler.Requests);
        Assert.Equal(FakeKey, Assert.Single(sent.Headers.GetValues(GeminiProvider.KeyHeader)));
        Assert.DoesNotContain(FakeKey, sent.RequestUri!.ToString());
        Assert.DoesNotContain("key=", sent.RequestUri.Query);
        Assert.Equal($"/v1beta/models/{AiOptions.DefaultGeminiModel}:generateContent", sent.RequestUri.AbsolutePath);
    }

    [Theory]
    [InlineData(HttpStatusCode.TooManyRequests, """{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}""", 1)]
    [InlineData(HttpStatusCode.BadRequest, """{"error":{"code":400,"status":"INVALID_ARGUMENT"}}""", 1)]
    [InlineData(HttpStatusCode.ServiceUnavailable, """{"error":{"code":503,"status":"UNAVAILABLE"}}""", 2)]
    [InlineData(HttpStatusCode.InternalServerError, "not json", 2)]
    public async Task Error_statuses_become_provider_errors_and_only_transient_ones_are_retried_once(
        HttpStatusCode status, string body, int attempts)
    {
        var handler = new CaptureHandler(status, body);
        var provider = Provider(handler, new AiOptions { GeminiApiKey = FakeKey });
        await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(new AiRequest("Quy tắc", [new AiUserMessage("Hi")], []), default));
        Assert.Equal(attempts, handler.Requests.Count);
    }

    [Fact]
    public async Task An_overloaded_answer_followed_by_success_is_a_success()
    {
        var handler = new CaptureHandler(HttpStatusCode.ServiceUnavailable, """{"error":{"status":"UNAVAILABLE"}}""",
            then: (HttpStatusCode.OK, """{"candidates":[{"content":{"role":"model","parts":[{"text":"Chào"}]}}]}"""));
        var provider = Provider(handler, new AiOptions { GeminiApiKey = FakeKey });
        var turn = await provider.CompleteAsync(new AiRequest("Quy tắc", [new AiUserMessage("Hi")], []), default);
        Assert.Equal(("Chào", 2), (turn.Text, handler.Requests.Count));
    }

    [Fact]
    public async Task Missing_key_or_odd_model_id_is_not_configured_and_sends_nothing()
    {
        var handler = new CaptureHandler(HttpStatusCode.OK, "{}");
        AiOptions[] invalid = [new AiOptions(), new AiOptions { GeminiApiKey = FakeKey, GeminiModel = "../x?key=1" }];
        foreach (var options in invalid)
        {
            var provider = Provider(handler, options);
            Assert.False(provider.IsConfigured);
            await Assert.ThrowsAsync<AiProviderException>(() =>
                provider.CompleteAsync(new AiRequest("Quy tắc", [new AiUserMessage("Hi")], []), default));
        }
        Assert.Empty(handler.Requests);
    }

    private static GeminiProvider Provider(HttpMessageHandler handler, AiOptions options) =>
        new(new HttpClient(handler) { BaseAddress = GeminiProvider.BaseAddress }, Options.Create(options),
            NullLogger<GeminiProvider>.Instance);

    /// <summary>Answers (status, body) to every request, or `then` from the second request on.</summary>
    private sealed class CaptureHandler(HttpStatusCode status, string body, (HttpStatusCode, string)? then = null)
        : HttpMessageHandler
    {
        public List<HttpRequestMessage> Requests { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Requests.Add(request);
            var (code, text) = Requests.Count > 1 && then is { } next ? next : (status, body);
            return Task.FromResult(new HttpResponseMessage(code)
            {
                Content = new StringContent(text, Encoding.UTF8, "application/json"),
            });
        }
    }
}
