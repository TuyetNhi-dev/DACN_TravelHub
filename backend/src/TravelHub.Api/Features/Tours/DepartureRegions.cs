using System.Text.RegularExpressions;

namespace TravelHub.Api.Features.Tours;

/// <summary>
/// The "Khởi hành từ" filter of /tours: which departure cities belong to each region. Moved from the frontend
/// (frontend/src/lib/departure-region.ts) so filtering and paging happen in one place; both keep the same lists.
/// These are UX groupings of literal city labels, including former province names, NOT an administrative lookup.
/// </summary>
public static partial class DepartureRegions
{
    public const string HoChiMinhCity = "hcm";

    private static readonly string[] HoChiMinhNames = ["Hồ Chí Minh", "HCM", "TPHCM", "Sài Gòn"];

    private static readonly Dictionary<string, string[]> Names = new()
    {
        ["north"] = ["Hà Nội", "Hà Giang", "Cao Bằng", "Bắc Kạn", "Tuyên Quang", "Lào Cai", "Điện Biên", "Lai Châu",
            "Sơn La", "Yên Bái", "Hòa Bình", "Thái Nguyên", "Lạng Sơn", "Quảng Ninh", "Bắc Giang", "Phú Thọ",
            "Vĩnh Phúc", "Bắc Ninh", "Hải Dương", "Hải Phòng", "Hưng Yên", "Thái Bình", "Hà Nam", "Nam Định",
            "Ninh Bình"],
        ["central"] = ["Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Huế", "Thừa Thiên Huế",
            "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận",
            "Nha Trang", "Quy Nhơn", "Đồng Hới", "Tam Kỳ"],
        ["highlands"] = ["Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng", "Buôn Ma Thuột", "Buôn Mê Thuột",
            "Pleiku", "Đà Lạt"],
        ["southeast"] = [.. HoChiMinhNames, "Bình Phước", "Tây Ninh", "Bình Dương", "Đồng Nai", "Bà Rịa Vũng Tàu",
            "Vũng Tàu", "Biên Hòa", "Thủ Dầu Một"],
        ["southwest"] = ["Long An", "Tiền Giang", "Bến Tre", "Trà Vinh", "Vĩnh Long", "Đồng Tháp", "An Giang",
            "Kiên Giang", "Cần Thơ", "Hậu Giang", "Sóc Trăng", "Bạc Liêu", "Cà Mau", "Phú Quốc", "Rạch Giá",
            "Mỹ Tho", "Long Xuyên", "Châu Đốc"],
    };

    private static readonly Dictionary<string, HashSet<string>> NormalizedNames = Names
        .Append(new KeyValuePair<string, string[]>(HoChiMinhCity, HoChiMinhNames))
        .ToDictionary(pair => pair.Key, pair => pair.Value.Select(Normalize).ToHashSet());

    public static bool IsValid(string code) => NormalizedNames.ContainsKey(code);

    /// <summary>Whether a departure city label (e.g. "TP. Hồ Chí Minh") belongs to the region.</summary>
    public static bool Contains(string code, string cityName) =>
        NormalizedNames.TryGetValue(code, out var names) && names.Contains(Normalize(cityName));

    /// <summary>"TP. Hồ Chí Minh" → "ho chi minh": accents, "đ", punctuation and a "thành phố/tỉnh/tp" prefix go.</summary>
    public static string Normalize(string name)
    {
        var plain = SearchText.Normalize(Punctuation().Replace(name, " "));
        return SpacedOut().Replace(AdministrativePrefix().Replace(plain, ""), " ").Trim();
    }

    [GeneratedRegex("[.,-]")]
    private static partial Regex Punctuation();

    [GeneratedRegex(@"^(thanh pho|tinh|tp)\s*")]
    private static partial Regex AdministrativePrefix();

    [GeneratedRegex(@"\s+")]
    private static partial Regex SpacedOut();
}
