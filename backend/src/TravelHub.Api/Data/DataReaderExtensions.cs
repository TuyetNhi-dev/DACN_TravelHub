using System.Globalization;
using MySqlConnector;

namespace TravelHub.Api.Data;

/// <summary>Named, null-aware column readers so mappers stay declarative and ordinal-free.</summary>
public static class DataReaderExtensions
{
    public static string GetId(this MySqlDataReader reader, string column) =>
        reader.GetUInt64(column).ToString(CultureInfo.InvariantCulture);

    public static string? GetNullableId(this MySqlDataReader reader, string column) =>
        reader.IsDBNull(reader.GetOrdinal(column)) ? null : reader.GetId(column);

    public static string? GetNullableString(this MySqlDataReader reader, string column) =>
        reader.IsDBNull(reader.GetOrdinal(column)) ? null : reader.GetString(column);

    public static int? GetNullableInt(this MySqlDataReader reader, string column) =>
        reader.IsDBNull(reader.GetOrdinal(column)) ? null : reader.GetInt32(column);

    public static decimal? GetNullableDecimal(this MySqlDataReader reader, string column) =>
        reader.IsDBNull(reader.GetOrdinal(column)) ? null : reader.GetDecimal(column);

    /// <summary>A TIME column as a wall-clock "HH:mm" string, e.g. 14:00:00 → "14:00".</summary>
    public static string? GetNullableClock(this MySqlDataReader reader, string column) =>
        reader.IsDBNull(reader.GetOrdinal(column))
            ? null
            : reader.GetTimeSpan(column).ToString(@"hh\:mm", CultureInfo.InvariantCulture);

    public static DateOnly GetDateOnly(this MySqlDataReader reader, string column) =>
        DateOnly.FromDateTime(reader.GetDateTime(column));

    public static DateOnly? GetNullableDateOnly(this MySqlDataReader reader, string column) =>
        reader.IsDBNull(reader.GetOrdinal(column)) ? null : reader.GetDateOnly(column);

    /// <summary>DATETIME columns hold UTC by convention; mark them so JSON carries the "Z" suffix.</summary>
    public static DateTime GetUtcDateTime(this MySqlDataReader reader, string column) =>
        DateTime.SpecifyKind(reader.GetDateTime(column), DateTimeKind.Utc);

    public static DateTime? GetNullableUtcDateTime(this MySqlDataReader reader, string column) =>
        reader.IsDBNull(reader.GetOrdinal(column)) ? null : reader.GetUtcDateTime(column);

    /// <summary>Parses a GROUP_CONCAT of ISO dates (comma separated) into a list.</summary>
    public static IReadOnlyList<DateOnly> GetDateList(this MySqlDataReader reader, string column)
    {
        var raw = reader.GetNullableString(column);
        if (string.IsNullOrEmpty(raw)) return [];
        return raw.Split(',').Select(value => DateOnly.ParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture))
            .ToList();
    }

    public static async Task<List<T>> ReadAllAsync<T>(this MySqlCommand command,
        Func<MySqlDataReader, T> map, CancellationToken ct)
    {
        await using var reader = await command.ExecuteReaderAsync(ct);
        var rows = new List<T>();
        while (await reader.ReadAsync(ct))
            rows.Add(map(reader));
        return rows;
    }

    public static async Task<T?> ReadSingleAsync<T>(this MySqlCommand command,
        Func<MySqlDataReader, T> map, CancellationToken ct) where T : class
    {
        await using var reader = await command.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? map(reader) : null;
    }
}
