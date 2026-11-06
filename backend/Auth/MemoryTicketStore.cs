using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Cryptography;

namespace TravelHub.Api.Auth;

// Revocable sessions for a single backend instance. Restart signs everyone out.
public sealed class MemoryTicketStore(IMemoryCache cache) : ITicketStore
{
    public Task<string> StoreAsync(AuthenticationTicket ticket)
    {
        var key = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        return StoreNewAsync(key, ticket);
    }
    private async Task<string> StoreNewAsync(string key, AuthenticationTicket ticket)
    {
        await RenewAsync(key, ticket); return key;
    }
    public Task RenewAsync(string key, AuthenticationTicket ticket)
    {
        cache.Set("auth:" + key, ticket, ticket.Properties.ExpiresUtc ?? DateTimeOffset.UtcNow.AddHours(8));
        return Task.CompletedTask;
    }
    public Task<AuthenticationTicket?> RetrieveAsync(string key) =>
        Task.FromResult(cache.Get<AuthenticationTicket>("auth:" + key));
    public Task RemoveAsync(string key) { cache.Remove("auth:" + key); return Task.CompletedTask; }
}
