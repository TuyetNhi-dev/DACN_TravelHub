namespace TravelHub.Api.Configuration;

public sealed class DatabaseOptions
{
    public string Host { get; set; } = "";
    public uint Port { get; set; }
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string Name { get; set; } = "";
    public string SslCa { get; set; } = "";
}
