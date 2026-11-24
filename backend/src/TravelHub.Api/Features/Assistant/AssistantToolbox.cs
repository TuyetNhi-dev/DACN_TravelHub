using System.Globalization;
using System.Text.Json;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Features.Assistant;

/// <summary>What the tools found during one chat turn; the reply's cards and links come from here only.</summary>
public sealed class AssistantFindings
{
    private readonly List<TourSummaryDto> tours = [];
    private readonly List<AssistantSourceDto> sources = [];

    public IReadOnlyList<TourSummaryDto> Tours => tours;
    public IReadOnlyList<AssistantSourceDto> Sources => sources;

    public void AddTours(IEnumerable<TourSummaryDto> found)
    {
        foreach (var tour in found)
            if (tours.Count < AssistantRules.MaxTourCards && tours.All(t => t.Id != tour.Id)) tours.Add(tour);
    }

    public void AddSource(KnowledgeEntry entry)
    {
        if (sources.All(s => s.Url != entry.Url)) sources.Add(new AssistantSourceDto(entry.Title, entry.Url));
    }
}

/// <summary>
/// The tool allowlist. Anything else the model asks for is refused without running. Arguments are checked here,
/// because the model is untrusted input; a bad argument goes back to the model as an error, not a 500.
/// </summary>
public sealed class AssistantToolbox(ITourCatalog catalog, AssistantKnowledge knowledge,
    ILogger<AssistantToolbox> logger)
{
    public const string SearchTours = "search_tours";
    public const string GetPolicy = "get_policy";
    private const int MaxTextArgument = 100;
    private const int MaxLoggedName = 40;

    public static readonly IReadOnlyList<AiToolDefinition> Definitions = AssistantToolSchemas.All;

    public async Task<JsonElement> ExecuteAsync(AiToolCall call, AssistantFindings findings, CancellationToken ct)
    {
        try
        {
            return call.Name switch
            {
                SearchTours => await SearchToursAsync(call.Arguments, findings, ct),
                GetPolicy => FindPolicy(call.Arguments, findings),
                _ => Refuse(call.Name),
            };
        }
        catch (ToolArgumentException exception)
        {
            return Error(exception.Message);
        }
        catch (ApiValidationException exception)
        {
            return Error(string.Join(" ", exception.Errors.SelectMany(pair => pair.Value)));
        }
    }

    public static JsonElement Error(string message) => JsonSerializer.SerializeToElement(new { error = message });

    private JsonElement Refuse(string name)
    {
        logger.LogWarning("Assistant model asked for a tool outside the allowlist: {Tool}",
            name.Length > MaxLoggedName ? name[..MaxLoggedName] : name);
        return Error("Công cụ này không được phép. Chỉ dùng search_tours hoặc get_policy.");
    }

    private async Task<JsonElement> SearchToursAsync(JsonElement args, AssistantFindings findings, CancellationToken ct)
    {
        var query = new TourSearchQuery(Text(args, "query"), null, Int(args, "minDays"), Int(args, "maxDays"),
            Date(args, "dateFrom"), Date(args, "dateTo"), Price(args, "maxPrice"), null, null, 1,
            AssistantRules.ToursPerSearch, Text(args, "departureRegion"));
        var tours = InRange(await catalog.SearchAsync(query, ct), query.DateFrom, query.DateTo);
        findings.AddTours(tours);
        // Prices and dates are left out on purpose: the model cannot repeat what it never sees; the cards show them.
        return JsonSerializer.SerializeToElement(new
        {
            count = tours.Count,
            tours = tours.Select(t => new
            {
                t.Code, t.Title, t.Destination, t.DepartureFrom, t.DurationDays, t.DurationNights,
                hasOpenDepartures = t.UpcomingDepartureDates.Count > 0,
            }),
            note = tours.Count == 0 ? "Không có tour phù hợp." : "Các tour này được hiển thị cho khách dưới dạng thẻ.",
        });
    }

    /// <summary>
    /// With a date filter, a card's departure dates are narrowed to that window, so "tháng 12" shows a December date
    /// rather than an earlier one. Still catalogue data; a tour is only listed when one of its dates is in the window.
    /// </summary>
    public static IReadOnlyList<TourSummaryDto> InRange(IReadOnlyList<TourSummaryDto> tours, DateOnly? from,
        DateOnly? to)
    {
        if (from is null && to is null) return tours;
        return tours.Select(tour =>
        {
            var dates = tour.UpcomingDepartureDates.Where(d => (from is null || d >= from) && (to is null || d <= to))
                .ToList();
            return dates.Count == 0 ? tour : tour with { UpcomingDepartureDates = dates };
        }).ToList();
    }

    private JsonElement FindPolicy(JsonElement args, AssistantFindings findings)
    {
        var topic = Text(args, "topic") ?? throw new ToolArgumentException("Thiếu topic.");
        var entries = knowledge.Search(topic);
        foreach (var entry in entries) findings.AddSource(entry);
        return JsonSerializer.SerializeToElement(new
        {
            count = entries.Count,
            results = entries.Select(e =>
                new { e.Title, e.Url, text = Clip(e.Text, AssistantKnowledge.MaxTextLength) }),
        });
    }

    private static string? Text(JsonElement args, string name)
    {
        if (!TryGet(args, name, out var value)) return null;
        if (value.ValueKind != JsonValueKind.String) throw new ToolArgumentException($"{name} phải là chuỗi.");
        var text = value.GetString()!.Trim();
        if (text.Length > MaxTextArgument) throw new ToolArgumentException($"{name} tối đa {MaxTextArgument} ký tự.");
        return text.Length == 0 ? null : text;
    }

    private static int? Int(JsonElement args, string name)
    {
        if (!TryGet(args, name, out var value)) return null;
        // Models sometimes send whole numbers as 3.0; anything fractional is a mistake.
        if (value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out var number) && number % 1 == 0
            && number is >= 1 and <= TourSearchRules.MaxDays)
            return (int)number;
        throw new ToolArgumentException($"{name} phải là số ngày từ 1 đến {TourSearchRules.MaxDays}.");
    }

    private static decimal? Price(JsonElement args, string name)
    {
        if (!TryGet(args, name, out var value)) return null;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetDecimal(out var price) && price > 0) return price;
        throw new ToolArgumentException($"{name} phải là số tiền VND lớn hơn 0.");
    }

    private static DateOnly? Date(JsonElement args, string name)
    {
        if (Text(args, name) is not { } raw) return null;
        var culture = CultureInfo.InvariantCulture;
        return DateOnly.TryParseExact(raw, "yyyy-MM-dd", culture, DateTimeStyles.None, out var date)
            ? date
            : throw new ToolArgumentException($"{name} phải có dạng YYYY-MM-DD.");
    }

    private static bool TryGet(JsonElement args, string name, out JsonElement value)
    {
        value = default;
        return args.ValueKind == JsonValueKind.Object && args.TryGetProperty(name, out value)
            && value.ValueKind != JsonValueKind.Null;
    }

    private static string Clip(string text, int max) => text.Length <= max ? text : text[..(max - 1)] + "…";

    private sealed class ToolArgumentException(string message) : Exception(message);
}
