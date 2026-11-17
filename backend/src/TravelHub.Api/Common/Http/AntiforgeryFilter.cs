using Microsoft.AspNetCore.Antiforgery;
using TravelHub.Api.Common.Errors;

namespace TravelHub.Api.Common.Http;

/// <summary>
/// Cookie-authenticated state changes must carry the X-CSRF-Token header issued by /api/auth/csrf.
/// Responses are never cached because they contain personal data.
/// </summary>
public sealed class AntiforgeryFilter(IAntiforgery antiforgery) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var http = context.HttpContext;
        http.Response.Headers.CacheControl = "no-store";
        if (!HttpMethods.IsGet(http.Request.Method) && !HttpMethods.IsHead(http.Request.Method))
        {
            try
            {
                await antiforgery.ValidateRequestAsync(http);
            }
            catch (AntiforgeryValidationException)
            {
                throw ApiException.BadRequest("Phiên biểu mẫu đã hết hạn. Vui lòng tải lại trang và thử lại.");
            }
        }
        return await next(context);
    }
}
