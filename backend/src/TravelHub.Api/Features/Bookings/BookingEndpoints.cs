using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Features.Bookings;

public static class BookingEndpoints
{
    public const string CreateRateLimitPolicy = "booking-create";

    public static void MapBookingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/bookings").WithTags("Bookings")
            .RequireAuthorization().AddEndpointFilter<AntiforgeryFilter>();

        group.MapPost("/tours", async (CreateTourBookingRequest request, HttpContext http, BookingService service,
                CancellationToken ct) => Created(await service.CreateTourAsync(http.GetRequiredContactUserId(), request, ct)))
            .RequireRateLimiting(CreateRateLimitPolicy);
        group.MapPost("/hotels", async (CreateHotelBookingRequest request, HttpContext http, BookingService service,
                CancellationToken ct) => Created(await service.CreateHotelAsync(http.GetRequiredContactUserId(), request, ct)))
            .RequireRateLimiting(CreateRateLimitPolicy);
        group.MapPost("/flights", async (CreateFlightBookingRequest request, HttpContext http,
                BookingService service, CancellationToken ct) =>
                Created(await service.CreateFlightAsync(http.GetRequiredContactUserId(), request, ct)))
            .RequireRateLimiting(CreateRateLimitPolicy);

        group.MapGet("/me", async (HttpContext http, BookingService service, CancellationToken ct) =>
            Results.Ok(ListResponse<BookingSummaryDto>.From(
                await service.ListForCustomerAsync(http.GetRequiredUserId(), ct))));
        group.MapGet("/{id}", async (string id, HttpContext http, BookingService service, CancellationToken ct) =>
            Results.Ok(new ItemResponse<BookingDetailDto>(
                await service.GetForCustomerAsync(http.GetRequiredUserId(), id, ct))));
        group.MapPost("/{id}/pay", async (string id, PayBookingRequest request, HttpContext http,
                BookingPaymentService service, CancellationToken ct) => Results.Ok(new ItemResponse<BookingDetailDto>(
                await service.PayAsync(http.GetRequiredUserId(), id, request, ct))))
            .RequireRateLimiting(CreateRateLimitPolicy);
        group.MapPost("/{id}/cancel", async (string id, HttpContext http, BookingService service,
            CancellationToken ct) => Results.Ok(new ItemResponse<BookingDetailDto>(
                await service.CancelForCustomerAsync(http.GetRequiredUserId(), id, ct))));
    }

    private static IResult Created(BookingDetailDto booking) =>
        Results.Created($"/api/bookings/{booking.Id}", new ItemResponse<BookingDetailDto>(booking));
}
