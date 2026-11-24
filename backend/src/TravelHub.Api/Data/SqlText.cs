namespace TravelHub.Api.Data;

public static class SqlText
{
    /// <summary>Makes % and _ typed by staff match literally (MySQL's default LIKE escape is backslash).</summary>
    public static string EscapeLike(string value) =>
        value.Replace(@"\", @"\\").Replace("%", @"\%").Replace("_", @"\_");

    /// <summary>A LIKE pattern matching the value anywhere.</summary>
    public static string Contains(string value) => "%" + EscapeLike(value) + "%";

    /// <summary>A LIKE pattern matching values that begin with the value.</summary>
    public static string StartsWith(string value) => EscapeLike(value) + "%";
}
