using Microsoft.Extensions.Options;
using MySqlConnector;
using TravelHub.Api.Configuration;

namespace TravelHub.Api.Data;

public sealed class DatabaseConfigurationException : Exception
{
    public DatabaseConfigurationException() : base("Database configuration is missing or invalid.") { }
}

public sealed class MySqlConnectionFactory(IOptions<DatabaseOptions> options)
{
    public async Task<MySqlConnection> OpenAsync(CancellationToken ct)
    {
        var config = options.Value;
        // Use the configured database; do not tie connections to a demo schema.
        if (string.IsNullOrWhiteSpace(config.Host) || config.Port is 0 or > 65535 ||
            string.IsNullOrWhiteSpace(config.Username) || string.IsNullOrEmpty(config.Password) ||
            string.IsNullOrWhiteSpace(config.Name) || string.IsNullOrWhiteSpace(config.SslCa) ||
            !Path.IsPathFullyQualified(config.SslCa) || !File.Exists(config.SslCa))
            throw new DatabaseConfigurationException();

        var connectionString = new MySqlConnectionStringBuilder
        {
            Server = config.Host,
            Port = config.Port,
            UserID = config.Username,
            Password = config.Password,
            Database = config.Name,
            SslMode = MySqlSslMode.VerifyFull,
            SslCa = config.SslCa,
            PersistSecurityInfo = false,
            AllowUserVariables = false,
            AllowLoadLocalInfile = false,
            ConnectionTimeout = 10,
            DefaultCommandTimeout = 15
        };
        var connection = new MySqlConnection(connectionString.ConnectionString);
        try
        {
            await connection.OpenAsync(ct);
            return connection;
        }
        catch
        {
            await connection.DisposeAsync();
            throw;
        }
    }
}
