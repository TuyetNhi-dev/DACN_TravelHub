using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Cart;

public static class CartEndpoints
{
    /// <summary>Per client IP for the anonymous quote (see SecurityRegistration).</summary>
    public const string QuoteRateLimitPolicy = "cart-quote";

    public static void MapCartEndpoints(this IEndpointRouteBuilder app)
    {
        var account = app.MapGroup("/api/cart").WithTags("Cart")
            .RequireAuthorization().AddEndpointFilter<AntiforgeryFilter>();
        account.MapGet("/", async (HttpContext http, CartService service, CancellationToken ct) =>
            Results.Ok(new ItemResponse<CartDto>(await service.GetAsync(http.GetRequiredUserId(), ct))));
        account.MapPost("/items", async (SaveCartItemRequest request, HttpContext http, CartService service,
            CancellationToken ct) =>
            Results.Ok(new ItemResponse<CartDto>(await service.SaveAsync(http.GetRequiredUserId(), request, ct))));
        account.MapDelete("/items/{id}", async (string id, HttpContext http, CartService service,
            CancellationToken ct) =>
            Results.Ok(new ItemResponse<CartDto>(await service.DeleteAsync(http.GetRequiredUserId(), id, ct))));
        account.MapPost("/merge", async (GuestCartRequest request, HttpContext http, CartService service,
            CancellationToken ct) =>
            Results.Ok(new ItemResponse<MergeCartResultDto>(
                await service.MergeAsync(http.GetRequiredUserId(), request, ct))));

        // Guests: prices the cart kept in their browser. Anonymous and read-only, but CSRF-checked and rate limited.
        app.MapGroup("/api/cart").WithTags("Cart").AddEndpointFilter<AntiforgeryFilter>()
            .MapPost("/quote", async (GuestCartRequest request, CartService service, CancellationToken ct) =>
                Results.Ok(new ItemResponse<CartDto>(await service.QuoteAsync(request, ct))))
            .RequireRateLimiting(QuoteRateLimitPolicy);
    }
}
