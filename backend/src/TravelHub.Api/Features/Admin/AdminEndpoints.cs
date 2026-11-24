using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Admin.Bookings;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Admin;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/bookings").WithTags("Admin")
            .RequireAuthorization().AddEndpointFilter<AntiforgeryFilter>();

        group.MapGet("/", async ([AsParameters] AdminBookingQuery query, HttpContext http,
            AdminBookingService service, CancellationToken ct) =>
            Results.Ok(ListResponse<BookingSummaryDto>.From(
                await service.ListAsync(http.GetRequiredAccount(), query, ct))));
        group.MapGet("/{id}", async (string id, HttpContext http, AdminBookingService service,
            CancellationToken ct) => Item(await service.GetAsync(http.GetRequiredAccount(), id, ct)));
        group.MapPost("/{id}/confirm", async (string id, ConfirmBookingRequest request, HttpContext http,
            AdminBookingService service, CancellationToken ct) =>
            Item(await service.ConfirmAsync(http.GetRequiredAccount(), id, request, ct)));
        group.MapPost("/{id}/reject", async (string id, HttpContext http, AdminBookingService service,
            CancellationToken ct) => Item(await service.RejectAsync(http.GetRequiredAccount(), id, ct)));
        group.MapPost("/{id}/complete", async (string id, HttpContext http, AdminBookingService service,
            CancellationToken ct) => Item(await service.CompleteAsync(http.GetRequiredAccount(), id, ct)));
        group.MapPost("/{id}/cancel", async (string id, HttpContext http, AdminBookingService service,
            CancellationToken ct) => Item(await service.CancelAsync(http.GetRequiredAccount(), id, ct)));
        group.MapGet("/{id}/activity", async (string id, HttpContext http, BookingActivityService service,
            CancellationToken ct) => Results.Ok(new ItemResponse<BookingActivityDto>(
                await service.GetAsync(http.GetRequiredAccount(), id, ct))));
        group.MapPost("/{id}/notes", async (string id, BookingNoteRequest request, HttpContext http,
            BookingActivityService service, CancellationToken ct) => Results.Ok(new ItemResponse<BookingActivityDto>(
                await service.AddNoteAsync(http.GetRequiredAccount(), id, request, ct))));
    }

    private static IResult Item(BookingDetailDto booking) => Results.Ok(new ItemResponse<BookingDetailDto>(booking));
}
