namespace TravelHub.Api.Common.Errors;

/// <summary>
/// Business error with a deliberate HTTP status. The message is shown to end users, so it is Vietnamese
/// and must never contain SQL, stack traces or personal data.
/// </summary>
public class ApiException(int statusCode, string message, string? code = null) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    /// <summary>Optional machine-readable reason, written as "code" in the problem JSON.</summary>
    public string? Code { get; } = code;

    public static ApiException BadRequest(string message, string? code = null) =>
        new(StatusCodes.Status400BadRequest, message, code);
    public static ApiException Unauthorized(string message) => new(StatusCodes.Status401Unauthorized, message);
    public static ApiException Forbidden(string message, string? code = null) =>
        new(StatusCodes.Status403Forbidden, message, code);
    public static ApiException NotFound(string message) => new(StatusCodes.Status404NotFound, message);
    public static ApiException Conflict(string message) => new(StatusCodes.Status409Conflict, message);
}

public sealed class ApiValidationException(IReadOnlyDictionary<string, string[]> errors)
    : ApiException(StatusCodes.Status400BadRequest, "Dữ liệu gửi lên chưa hợp lệ.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}
