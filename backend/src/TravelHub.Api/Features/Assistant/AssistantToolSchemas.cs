using System.Text.Json;
using TravelHub.Api.Features.Tours;

namespace TravelHub.Api.Features.Assistant;

/// <summary>JSON schemas of the two allowed tools, as the model sees them (OpenAPI-style lower-case types).</summary>
public static class AssistantToolSchemas
{
    /// <summary>Same codes as the departure picker of the site (DepartureRegions).</summary>
    public static readonly string[] RegionCodes = ["hcm", "north", "central", "highlands", "southeast", "southwest"];

    public static readonly IReadOnlyList<AiToolDefinition> All =
    [
        new(AssistantToolbox.SearchTours,
            "Tìm tour đang mở bán của SàiHành. Trả về danh sách tour (mã, tên, điểm đến, thời lượng) để hiển thị "
            + "cho khách dưới dạng thẻ có giá và lịch khởi hành thật.",
            Schema(new
            {
                type = "object",
                properties = new Dictionary<string, object>
                {
                    ["query"] = Text(
                        "Điểm đến hoặc tên tour, ví dụ \"Đà Lạt\", \"Phú Quốc\". Bỏ trống nếu khách không nói."),
                    ["departureRegion"] = new
                    {
                        type = "string", @enum = RegionCodes,
                        description = "Nơi khởi hành: hcm = TP.HCM/Sài Gòn, north = miền Bắc, central = miền Trung, "
                            + "highlands = Tây Nguyên, southeast = Đông Nam Bộ, southwest = miền Tây Nam Bộ.",
                    },
                    ["minDays"] = Days("Số ngày tối thiểu của tour."),
                    ["maxDays"] = Days("Số ngày tối đa của tour."),
                    ["maxPrice"] = new
                    {
                        type = "number", description = "Giá tối đa mỗi khách, đơn vị VND (5 triệu = 5000000).",
                    },
                    ["dateFrom"] = Text("Khởi hành từ ngày, dạng YYYY-MM-DD."),
                    ["dateTo"] = Text("Khởi hành đến ngày, dạng YYYY-MM-DD."),
                },
            })),
        new(AssistantToolbox.GetPolicy,
            "Tra cứu nội dung đã duyệt trên website SàiHành: câu hỏi thường gặp, chính sách (hủy, hoàn tiền, "
            + "thanh toán, dữ liệu cá nhân, điều khoản) và cẩm nang du lịch.",
            Schema(new
            {
                type = "object",
                properties = new Dictionary<string, object> { ["topic"] = Text("Chủ đề cần tra, ví dụ \"hủy tour\".") },
                required = new[] { "topic" },
            })),
    ];

    private static object Text(string description) => new { type = "string", description };

    private static object Days(string description) =>
        new { type = "integer", minimum = 1, maximum = TourSearchRules.MaxDays, description };

    private static JsonElement Schema(object schema) => JsonSerializer.SerializeToElement(schema);
}
