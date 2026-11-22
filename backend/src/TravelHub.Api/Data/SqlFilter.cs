using System.Text;
using MySqlConnector;

namespace TravelHub.Api.Data;

public static class SqlFilter
{
    /// <summary>Appends "AND condition" with its parameter, or nothing when the filter value is absent.</summary>
    /// <param name="condition">SQL written in code that references <paramref name="name"/>; never user input.</param>
    public static void AddIfPresent(StringBuilder sql, MySqlCommand command, string condition, string name,
        object? value)
    {
        if (value is null) return;
        sql.Append(" AND ").Append(condition);
        command.Parameters.AddWithValue(name, value);
    }
}
