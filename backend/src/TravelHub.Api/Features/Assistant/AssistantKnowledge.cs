using System.Text.Json;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Features.Assistant;

/// <summary>One FAQ answer or page section, with the site link of its anchor.</summary>
public sealed record KnowledgeEntry(string Id, string Kind, string Title, string Section, string Url, string Text);

/// <summary>
/// The approved site content the assistant may quote (help FAQ, policies, travel guides). Generated from the
/// frontend data by "npm run export:assistant-knowledge" and embedded in the assembly; a frontend test fails when
/// the file drifts from the pages. Search is a plain accent-free keyword match: small corpus, no external service.
/// </summary>
public sealed class AssistantKnowledge
{
    public const string ResourceName = "assistant-knowledge.json";
    public const int MaxResults = 3;
    /// <summary>Longest text handed to the model per entry, so one answer cannot fill the prompt.</summary>
    public const int MaxTextLength = 1200;
    private const int TitleWeight = 3;
    private static readonly char[] Separators = [' ', ',', '.', ':', ';', '?', '!', '(', ')', '"', '/', '–', '-', '\n'];

    // Words so common they would match almost every entry.
    private static readonly HashSet<string> StopWords =
    [
        "la", "va", "cua", "co", "khong", "toi", "ban", "the", "nao", "gi", "cho", "khi", "duoc", "mot", "cac",
        "nhung", "voi", "tu", "den", "thi", "o", "minh", "bi", "can", "lam", "sao", "nhu", "neu", "hay",
        "chinh", "sach",
    ];

    private readonly IReadOnlyList<(KnowledgeEntry Entry, HashSet<string> Title, HashSet<string> Body)> index;

    public AssistantKnowledge(IReadOnlyList<KnowledgeEntry> entries)
    {
        Entries = entries;
        index = entries.Select(e => (e, Words(e.Title + " " + e.Section), Words(e.Text))).ToList();
    }

    public IReadOnlyList<KnowledgeEntry> Entries { get; }

    public static AssistantKnowledge LoadEmbedded()
    {
        using var stream = typeof(AssistantKnowledge).Assembly.GetManifestResourceStream(ResourceName)
            ?? throw new InvalidOperationException($"Embedded resource {ResourceName} is missing.");
        using var document = JsonDocument.Parse(stream);
        var entries = document.RootElement.GetProperty("entries").Deserialize<List<KnowledgeEntry>>(
            new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? [];
        return new AssistantKnowledge(entries);
    }

    /// <summary>Best entries for the topic: a word in the title counts three times a word in the text.</summary>
    public IReadOnlyList<KnowledgeEntry> Search(string topic)
    {
        var words = Words(topic);
        if (words.Count == 0) return [];
        return index
            .Select(item => (item.Entry,
                Score: words.Sum(w => (item.Title.Contains(w) ? TitleWeight : 0) + (item.Body.Contains(w) ? 1 : 0))))
            .Where(item => item.Score > 0)
            .OrderByDescending(item => item.Score)
            .Take(MaxResults)
            .Select(item => item.Entry)
            .ToList();
    }

    private static HashSet<string> Words(string text) => SearchText.Normalize(text)
        .Split(Separators, StringSplitOptions.RemoveEmptyEntries)
        .Where(word => word.Length > 1 && !StopWords.Contains(word))
        .ToHashSet();
}
