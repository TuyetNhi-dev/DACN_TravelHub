using MySqlConnector;

namespace TravelHub.Api.Data;

/// <summary>One connection, one transaction: committed when the work returns, rolled back when it throws.</summary>
public sealed class Transaction(MySqlConnection connection, MySqlTransaction transaction)
{
    public MySqlConnection Connection => connection;
    public MySqlTransaction Inner => transaction;

    public MySqlCommand Command(string sql, params (string Name, object? Value)[] parameters)
    {
        var command = new MySqlCommand(sql, connection, transaction);
        foreach (var (name, value) in parameters) command.Parameters.AddWithValue(name, value);
        return command;
    }

    public async Task<int> ExecuteAsync(string sql, CancellationToken ct, params (string, object?)[] parameters)
    {
        await using var command = Command(sql, parameters);
        return await command.ExecuteNonQueryAsync(ct);
    }

    public async Task<ulong> InsertAsync(string sql, CancellationToken ct, params (string, object?)[] parameters)
    {
        await using var command = Command(sql, parameters);
        await command.ExecuteNonQueryAsync(ct);
        return (ulong)command.LastInsertedId;
    }
}

public static class TransactionExtensions
{
    public static async Task<T> InTransactionAsync<T>(this MySqlConnectionFactory connections,
        Func<Transaction, Task<T>> work, CancellationToken ct)
    {
        await using var connection = await connections.OpenAsync(ct);
        await using var transaction = await connection.BeginTransactionAsync(ct);
        var result = await work(new Transaction(connection, transaction));
        await transaction.CommitAsync(ct);
        return result;
    }
}
