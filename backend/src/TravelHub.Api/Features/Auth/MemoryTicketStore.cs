using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Caching.Memory;

namespace TravelHub.Api.Features.Auth;

/// <summary>Revocable server-side sessions for a single backend instance. A restart signs everyone out.</summary>
public sealed class MemoryTicketStore(IMemoryCache cache) : ITicketStore
{
    private const string KeyPrefix = "auth:";

    public async Task<string> StoreAsync(AuthenticationTicket ticket)
    {
        var key = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        await RenewAsync(key, ticket);
        return key;
    }

    public Task RenewAsync(string key, AuthenticationTicket ticket)
    {
        var expires = ticket.Properties.ExpiresUtc ?? DateTimeOffset.UtcNow.Add(AuthOptions.SessionLifetime);
        cache.Set(KeyPrefix + key, ticket, expires);
        return Task.CompletedTask;
    }

    public Task<AuthenticationTicket?> RetrieveAsync(string key) =>
        Task.FromResult(cache.Get<AuthenticationTicket>(KeyPrefix + key));

    public Task RemoveAsync(string key)
    {
        cache.Remove(KeyPrefix + key);
        return Task.CompletedTask;
    }
}
