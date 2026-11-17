using System.Globalization;
using TravelHub.Api.Common.Errors;

namespace TravelHub.Api.Common.Http;

/// <summary>Database keys are BIGINT UNSIGNED but travel over JSON as strings to stay safe in JavaScript.</summary>
public static class ResourceId
{
    public static ulong Parse(string? raw, string field)
    {
        if (TryParse(raw, out var value)) return value;
        throw new ApiValidationException(new Dictionary<string, string[]>
        {
            [field] = ["Mã định danh không hợp lệ."],
        });
    }

    public static bool TryParse(string? raw, out ulong value) =>
        ulong.TryParse(raw, NumberStyles.None, CultureInfo.InvariantCulture, out value) && value > 0;

    public static string Format(ulong value) => value.ToString(CultureInfo.InvariantCulture);
}
