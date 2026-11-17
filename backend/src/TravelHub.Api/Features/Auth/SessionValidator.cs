using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Auth;

/// <summary>
/// Re-checks every session against MySQL: a disabled account or a changed password hash ends the session
/// immediately instead of waiting for cookie expiry.
/// </summary>
public static class SessionValidator
{
    public static async Task ValidateAsync(CookieValidatePrincipalContext context)
    {
        var rawId = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
        var repository = context.HttpContext.RequestServices.GetRequiredService<AuthRepository>();
        var account = ResourceId.TryParse(rawId, out var id)
            ? await repository.FindByIdAsync(id, context.HttpContext.RequestAborted)
            : null;
        var stamp = context.Principal?.FindFirstValue(AuthOptions.PasswordStampClaim);
        if (account is null || !account.IsActive || stamp != account.CredentialStamp)
        {
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return;
        }
        // Shared only within this request; every new request validates again.
        context.HttpContext.Items[typeof(Account)] = account;
    }
}
