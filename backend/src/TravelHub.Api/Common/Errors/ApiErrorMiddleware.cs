using MySqlConnector;
using TravelHub.Api.Data;

namespace TravelHub.Api.Common.Errors;

/// <summary>Turns every failure into the shared RFC 7807 problem JSON with a Vietnamese detail.</summary>
public sealed class ApiErrorMiddleware(RequestDelegate next, ILogger<ApiErrorMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client disconnected; do not write to an aborted response.
        }
        catch (Exception exception)
        {
            if (context.Response.HasStarted) throw;
            context.Response.Clear();
            await ToResult(exception, context).ExecuteAsync(context);
        }
    }

    private IResult ToResult(Exception exception, HttpContext context)
    {
        var traceId = new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier };
        switch (exception)
        {
            case ApiValidationException validation:
                return Results.ValidationProblem(validation.Errors.ToDictionary(), detail: validation.Message,
                    title: ProblemTitles.For(validation.StatusCode), extensions: traceId);
            case ApiException business:
                if (business.Code is not null) traceId["code"] = business.Code;
                return Results.Problem(statusCode: business.StatusCode, title: ProblemTitles.For(business.StatusCode),
                    detail: business.Message, extensions: traceId);
            case BadHttpRequestException:
                return Results.Problem(statusCode: StatusCodes.Status400BadRequest,
                    title: ProblemTitles.For(StatusCodes.Status400BadRequest),
                    detail: "Yêu cầu không đúng định dạng.", extensions: traceId);
        }

        var status = IsDatabaseFailure(exception)
            ? StatusCodes.Status503ServiceUnavailable
            : StatusCodes.Status500InternalServerError;
        // Deliberately omit exception messages, SQL, paths and credentials from logs and JSON.
        logger.LogWarning("API request failed. Type={ErrorType}, MySqlCode={MySqlCode}, Cause={Cause}, TraceId={TraceId}",
            exception.GetType().Name, (exception as MySqlException)?.Number,
            exception.InnerException?.GetType().Name, context.TraceIdentifier);
        var detail = status == StatusCodes.Status503ServiceUnavailable
            ? "Không thể đọc dữ liệu lúc này. Vui lòng thử lại sau."
            : "Không thể xử lý yêu cầu.";
        return Results.Problem(statusCode: status, title: ProblemTitles.For(status), detail: detail,
            extensions: traceId);
    }

    private static bool IsDatabaseFailure(Exception exception) =>
        exception is MySqlException or DatabaseConfigurationException
            or System.Net.Sockets.SocketException or System.Security.Authentication.AuthenticationException;
}

public static class ProblemTitles
{
    public static string For(int status) => status switch
    {
        StatusCodes.Status400BadRequest => "Invalid request",
        StatusCodes.Status401Unauthorized => "Unauthorized",
        StatusCodes.Status403Forbidden => "Forbidden",
        StatusCodes.Status404NotFound => "Not found",
        StatusCodes.Status409Conflict => "Conflict",
        StatusCodes.Status429TooManyRequests => "Too many requests",
        StatusCodes.Status503ServiceUnavailable => "Service unavailable",
        _ => "Internal server error",
    };
}
