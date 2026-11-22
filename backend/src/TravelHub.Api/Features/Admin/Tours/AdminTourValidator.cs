using System.Text.RegularExpressions;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Admin.Tours;

/// <summary>Server-side rules of the tour editor. Pure, so every rule is unit-tested.</summary>
public static partial class AdminTourValidator
{
    public const int MaxDays = 60;
    public const decimal MaxPrice = 1_000_000_000m;
    public const int MaxDescription = 5000;
    public const int MaxImages = 20;
    public const int MaxInclusions = 40;

    public static ValidTour Tour(SaveTourRequest request)
    {
        var errors = new ValidationErrors();
        var code = request.Code?.Trim().ToUpperInvariant() ?? "";
        errors.AddIf(!CodePattern().IsMatch(code), "code", "Mã tour gồm 3–40 chữ in hoa, số hoặc dấu gạch ngang.");
        var title = request.Title?.Trim() ?? "";
        errors.AddIf(title.Length is < 5 or > 255, "title", "Tên tour cần từ 5 đến 255 ký tự.");
        var destination = Id(request.DestinationId, "destinationId", "Vui lòng chọn điểm đến.", errors);
        var branch = Id(request.OperatingBranchId, "operatingBranchId", "Vui lòng chọn chi nhánh điều hành.", errors);
        ulong? category = string.IsNullOrWhiteSpace(request.CategoryId)
            ? null : Id(request.CategoryId, "categoryId", "Danh mục không hợp lệ.", errors);
        var days = request.DurationDays ?? 0;
        var nights = request.DurationNights ?? -1;
        errors.AddIf(days is < 1 or > MaxDays, "durationDays", $"Số ngày từ 1 đến {MaxDays}.");
        errors.AddIf(nights < 0 || nights > days, "durationNights", "Số đêm từ 0 đến số ngày của tour.");
        var price = request.BasePrice ?? -1;
        errors.AddIf(price is < 0 or > MaxPrice, "basePrice", "Giá cơ bản không hợp lệ.");
        var description = Optional(request.Description);
        errors.AddIf(description?.Length > MaxDescription, "description", $"Mô tả tối đa {MaxDescription} ký tự.");
        errors.ThrowIfAny();
        return new ValidTour(code, title, destination, category, branch, days, nights, price, description);
    }

    public static string Status(string? raw) => raw is not null && AdminTourStatus.Settable.Contains(raw)
        ? raw
        : throw Field("status", "Trạng thái không hợp lệ.");

    /// <summary>Only the curated Unsplash host: next.config.ts optimises no other; photos must be credited.</summary>
    public static IReadOnlyList<AdminTourImageDto> Images(SaveTourImagesRequest request)
    {
        var images = request.Images ?? [];
        var errors = new ValidationErrors();
        errors.AddIf(images.Count > MaxImages, "images", $"Tối đa {MaxImages} ảnh.");
        for (var i = 0; i < images.Count; i++)
        {
            errors.AddIf(!ImageUrlPattern().IsMatch(images[i].Url ?? ""), $"images[{i}].url",
                "Chỉ nhận ảnh https://images.unsplash.com/photo-… (xem docs/design/image-credits.md).");
            errors.AddIf(images[i].AltText?.Length > 255, $"images[{i}].altText", "Mô tả ảnh tối đa 255 ký tự.");
        }
        errors.ThrowIfAny();
        return images.Select(i => new AdminTourImageDto(i.Url.Trim(), Optional(i.AltText))).ToList();
    }

    public static IReadOnlyList<AdminItineraryDayDto> Itinerary(SaveItineraryRequest request)
    {
        var days = request.Days ?? [];
        var errors = new ValidationErrors();
        errors.AddIf(days.Count > MaxDays, "days", $"Tối đa {MaxDays} ngày.");
        for (var i = 0; i < days.Count; i++)
        {
            var title = days[i].Title?.Trim() ?? "";
            errors.AddIf(title.Length is < 2 or > 255, $"days[{i}].title", "Tiêu đề ngày cần từ 2 đến 255 ký tự.");
            errors.AddIf(days[i].Description?.Length > MaxDescription, $"days[{i}].description",
                $"Nội dung tối đa {MaxDescription} ký tự.");
        }
        errors.ThrowIfAny();
        return days.Select((d, i) => new AdminItineraryDayDto(i + 1, d.Title!.Trim(), Optional(d.Description)))
            .ToList();
    }

    public static IReadOnlyList<AdminInclusionDto> Inclusions(SaveInclusionsRequest request)
    {
        var items = request.Items ?? [];
        var errors = new ValidationErrors();
        errors.AddIf(items.Count > MaxInclusions, "items", $"Tối đa {MaxInclusions} mục.");
        for (var i = 0; i < items.Count; i++)
        {
            errors.AddIf(!InclusionTypes.All.Contains(items[i].ServiceType ?? ""), $"items[{i}].serviceType",
                "Loại dịch vụ không hợp lệ.");
            var text = items[i].Description?.Trim() ?? "";
            errors.AddIf(text.Length is < 2 or > 500, $"items[{i}].description", "Nội dung cần từ 2 đến 500 ký tự.");
        }
        errors.ThrowIfAny();
        return items.Select(i => i with { Description = i.Description.Trim() }).ToList();
    }

    /// <summary>"TOUR001" → "TOUR001-BS", then "-BS2"…; cut so the result still fits the 40-character column.</summary>
    public static string CloneCode(string code, int attempt)
    {
        var suffix = attempt <= 1 ? "-BS" : $"-BS{attempt}";
        return (code.Length + suffix.Length > 40 ? code[..(40 - suffix.Length)] : code) + suffix;
    }

    private static ulong Id(string? raw, string field, string message, ValidationErrors errors)
    {
        if (ResourceId.TryParse(raw, out var id)) return id;
        errors.Add(field, message);
        return 0;
    }

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ApiValidationException Field(string field, string message) =>
        new(new Dictionary<string, string[]> { [field] = [message] });

    [GeneratedRegex("^[A-Z0-9][A-Z0-9-]{2,39}$")]
    private static partial Regex CodePattern();

    [GeneratedRegex(@"^https://images\.unsplash\.com/photo-[A-Za-z0-9-]+(\?[A-Za-z0-9=&%._-]*)?$")]
    private static partial Regex ImageUrlPattern();
}
