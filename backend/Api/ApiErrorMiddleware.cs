using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Api;

public sealed class ApiErrorMiddleware(RequestDelegate next, ILogger<ApiErrorMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client disconnected; do not write to an aborted response.
        }
        catch (Exception exception)
        {
            if (context.Response.HasStarted) throw;
            var status = exception is BadHttpRequestException ? StatusCodes.Status400BadRequest
                : exception is MySqlException or DatabaseConfigurationException
                or System.Net.Sockets.SocketException or System.Security.Authentication.AuthenticationException
                ? StatusCodes.Status503ServiceUnavailable
                : StatusCodes.Status500InternalServerError;
            // Deliberately omit exception messages, SQL, paths and credentials from logs and JSON.
            logger.LogWarning("API request failed. Type={ErrorType}, MySqlCode={MySqlCode}, Cause={Cause}, TraceId={TraceId}",
                exception.GetType().Name, (exception as MySqlException)?.Number,
                exception.InnerException?.GetType().Name, context.TraceIdentifier);
            context.Response.Clear();
            await Results.Problem(statusCode: status,
                title: status == 400 ? "Invalid request" : status == 503 ? "Database unavailable" : "Internal server error",
                detail: status == 503 ? "Không thể đọc dữ liệu lúc này. Vui lòng thử lại sau."
                    : "Không thể xử lý yêu cầu.",
                extensions: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier })
                .ExecuteAsync(context);
        }
    }
}
