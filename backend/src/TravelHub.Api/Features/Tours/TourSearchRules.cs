using System.Globalization;
using System.Text;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Tours;

/// <summary>Query string of GET /api/tours. Every filter is optional; none at all keeps the old response.</summary>
public sealed record TourSearchQuery(string? Q, string? DestinationId, int? MinDays, int? MaxDays, DateOnly? DateFrom,
    DateOnly? DateTo, decimal? MaxPrice, string? Sort, string? Region, int? Page, int? PageSize,
    string? DepartureRegion = null);

public enum TourSort { Default, PriceAscending, PriceDescending }

/// <summary>
/// A validated search. <see cref="Text"/> is already lower-case and accent-free (see SearchText).
/// <see cref="DepartureLocationIds"/> is filled by TourService from <see cref="DepartureRegion"/>: the departure
/// locations of that region, matched in C# with the same rules as the frontend (see DepartureRegions).
/// </summary>
public sealed record TourSearch(string? Text, ulong? DestinationId, int? MinDays, int? MaxDays, DateOnly? DateFrom,
    DateOnly? DateTo, decimal? MaxPrice, TourSort Sort, string? Region, string? DepartureRegion = null,
    IReadOnlyList<ulong>? DepartureLocationIds = null)
{
    public static readonly TourSearch None = new(null, null, null, null, null, null, null, TourSort.Default, null);
}

/// <summary>Pure rules of the public tour search, unit-tested without a database.</summary>
public static class TourSearchRules
{
    public const int MaxQueryLength = 100;
    public const int MaxDays = 60;

    private static readonly Dictionary<string, TourSort> Sorts = new()
    {
        ["price_asc"] = TourSort.PriceAscending, ["price_desc"] = TourSort.PriceDescending,
    };

    public static TourSearch Parse(TourSearchQuery query)
    {
        var errors = new ValidationErrors();
        var text = Optional(query.Q);
        errors.AddIf(text?.Length > MaxQueryLength, "q", $"Từ khóa tối đa {MaxQueryLength} ký tự.");
        ulong? destination = null;
        if (Optional(query.DestinationId) is { } rawDestination)
        {
            if (ResourceId.TryParse(rawDestination, out var id)) destination = id;
            else errors.Add("destinationId", "Điểm đến không hợp lệ.");
        }
        AddDays(query.MinDays, "minDays", errors);
        AddDays(query.MaxDays, "maxDays", errors);
        errors.AddIf(query.MinDays > query.MaxDays, "maxDays", "Số ngày tối đa phải từ số ngày tối thiểu trở lên.");
        errors.AddIf(query.DateFrom > query.DateTo, "dateTo", "Ngày kết thúc phải từ ngày bắt đầu trở đi.");
        errors.AddIf(query.MaxPrice < 0, "maxPrice", "Giá tối đa không hợp lệ.");
        var sort = ParseSort(query.Sort, errors);
        var departureRegion = Optional(query.DepartureRegion);
        errors.AddIf(departureRegion is not null && !DepartureRegions.IsValid(departureRegion), "departureRegion",
            "Vùng khởi hành không hợp lệ.");
        errors.ThrowIfAny();
        var region = TourService.ValidRegion(query.Region);
        return new TourSearch(text is null ? null : SearchText.Normalize(text), destination, query.MinDays,
            query.MaxDays, query.DateFrom, query.DateTo, query.MaxPrice, sort, region, departureRegion);
    }

    /// <summary>
    /// The month of the /tours date filter ("yyyy-MM"), as its first day. Required; months long past or far ahead
    /// are refused rather than scanned.
    /// </summary>
    public static DateOnly ParseCalendarMonth(string? month, DateOnly today)
    {
        var valid = DateOnly.TryParseExact(month?.Trim(), "yyyy-MM", CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var first);
        var current = new DateOnly(today.Year, today.Month, 1);
        if (valid && first >= current.AddMonths(-1) && first <= current.AddMonths(MaxCalendarMonthsAhead)) return first;
        throw new ApiValidationException(new Dictionary<string, string[]>
        {
            ["month"] = [$"Tháng phải có dạng yyyy-MM, trong vòng {MaxCalendarMonthsAhead} tháng tới."],
        });
    }

    public const int MaxCalendarMonthsAhead = 24;

    /// <summary>Below this many characters a suggestion would match almost everything, so none is looked up.</summary>
    public const int MinSuggestLength = 2;
    public const int SuggestDestinationLimit = 5;
    public const int SuggestTourLimit = 6;

    /// <summary>
    /// The search box text as SearchText, or null when it is too short to suggest anything (answered with an empty
    /// list, not an error, because the box asks while the customer is still typing).
    /// </summary>
    public static string? ParseSuggestion(string? q)
    {
        var text = Optional(q);
        if (text?.Length > MaxQueryLength)
            throw new ApiValidationException(new Dictionary<string, string[]>
            {
                ["q"] = [$"Từ khóa tối đa {MaxQueryLength} ký tự."],
            });
        var normalized = text is null ? null : SearchText.Normalize(text);
        return normalized?.Length >= MinSuggestLength ? normalized : null;
    }

    private static TourSort ParseSort(string? raw, ValidationErrors errors)
    {
        if (Optional(raw) is not { } value) return TourSort.Default;
        if (Sorts.TryGetValue(value, out var sort)) return sort;
        errors.Add("sort", "Cách sắp xếp không hợp lệ.");
        return TourSort.Default;
    }

    private static void AddDays(int? days, string field, ValidationErrors errors) =>
        errors.AddIf(days is < 1 or > MaxDays, field, $"Số ngày từ 1 đến {MaxDays}.");

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

/// <summary>
/// Lower-case, accent-free text ("Đà Nẵng" → "da nang"). The SQL side compares against
/// REPLACE(LOWER(column), 'đ', 'd') under utf8mb4_0900_ai_ci, which already ignores the other accents.
/// </summary>
public static class SearchText
{
    public static string Normalize(string value)
    {
        var decomposed = value.Trim().ToLowerInvariant().Replace('đ', 'd').Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        var lastWasSpace = false;
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
            var space = char.IsWhiteSpace(c);
            if (space && lastWasSpace) continue;
            builder.Append(space ? ' ' : c);
            lastWasSpace = space;
        }
        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
