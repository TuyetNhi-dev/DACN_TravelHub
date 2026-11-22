using System.Text;
using MySqlConnector;

namespace TravelHub.Api.Features.Admin.Access;

/// <summary>Adds the branch condition of a scope to a WHERE clause, always with parameters.</summary>
public static class ScopeSql
{
    /// <param name="column">A column name written in code (never user input), e.g. "b.selling_branch_id".</param>
    public static void AppendBranchFilter(StringBuilder sql, MySqlCommand command, string column, ScopeSet scope)
    {
        if (scope.IsGlobal) return;
        if (scope.BranchIds.Count == 0)
        {
            sql.Append(" AND 1 = 0");
            return;
        }
        var names = scope.BranchIds.Select((id, index) =>
        {
            var name = "@scopeBranch" + index;
            command.Parameters.AddWithValue(name, id);
            return name;
        });
        sql.Append(" AND ").Append(column).Append(" IN (").Append(string.Join(", ", names)).Append(')');
    }
}
