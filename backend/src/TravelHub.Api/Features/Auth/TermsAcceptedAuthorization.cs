using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using TravelHub.Api.Common.Errors;

namespace TravelHub.Api.Features.Auth;

/// <summary>Part of the default policy: the signed-in account has agreed to the policy and terms of use.</summary>
public sealed class TermsAcceptedRequirement : IAuthorizationRequirement;

/// <summary>Reads the account SessionValidator loaded for this request (a fresh database read every request).</summary>
public sealed class TermsAcceptedHandler : AuthorizationHandler<TermsAcceptedRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context,
        TermsAcceptedRequirement requirement)
    {
        var http = context.Resource as HttpContext;
        if (http?.FindAccount() is { HasAcceptedTerms: true }) context.Succeed(requirement);
        return Task.CompletedTask;
    }
}

/// <summary>
/// A refusal caused by the missing agreement gets its own problem JSON (403, code "terms_required"), so the browser
/// shows "Hoàn tất đăng ký" instead of a generic "không có quyền". Every other result is handled as usual.
/// </summary>
public sealed class TermsAwareAuthorizationResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler fallback = new();

    public async Task HandleAsync(RequestDelegate next, HttpContext context, AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        var missingTerms = authorizeResult.Forbidden && authorizeResult.AuthorizationFailure?.FailedRequirements
            .OfType<TermsAcceptedRequirement>().Any() == true;
        if (!missingTerms)
        {
            await fallback.HandleAsync(next, context, policy, authorizeResult);
            return;
        }
        await Results.Problem(statusCode: StatusCodes.Status403Forbidden, title: ProblemTitles.For(403),
            detail: "Vui lòng hoàn tất đăng ký: đồng ý với Chính sách bảo vệ dữ liệu cá nhân và Thỏa thuận sử dụng.",
            extensions: new Dictionary<string, object?>
            {
                ["code"] = AuthErrorCodes.TermsRequired, ["traceId"] = context.TraceIdentifier,
            }).ExecuteAsync(context);
    }
}
