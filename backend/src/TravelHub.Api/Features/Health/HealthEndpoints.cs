using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Data;

namespace TravelHub.Api.Features.Health;

public sealed record DatabaseHealthDto(string Status, string Database);

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/health/database", async (MySqlConnectionFactory connections, CancellationToken ct) =>
        {
            await using var connection = await connections.OpenAsync(ct);
            await using var command = new MySqlCommand("SELECT DATABASE()", connection);
            var database = await command.ExecuteScalarAsync(ct) as string
                ?? throw new ApiException(StatusCodes.Status503ServiceUnavailable, "Chưa chọn database.");
            return Results.Ok(new DatabaseHealthDto("ok", database));
        }).WithTags("Health");
    }
}
