using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Tickets;

/// <summary>The customer's tour e-ticket. Only paid tour orders have one; hotels and flights never do.</summary>
public sealed class TicketService(TicketRepository repository, IOptions<TicketOptions> options)
{
    /// <summary>A ticket can be shown for a paid order, and afterwards as a keepsake of a finished trip.</summary>
    public static readonly IReadOnlySet<string> TicketStatuses =
        new HashSet<string> { BookingItemStatus.Confirmed, BookingItemStatus.Completed };

    public async Task<TourTicketDto> GetForCustomerAsync(ulong customerId, string rawId, CancellationToken ct)
    {
        var bookingId = ResourceId.Parse(rawId, "id");
        // Another customer's order and a hotel or flight order look the same: not found.
        var item = await repository.FindCustomerTourItemAsync(customerId, bookingId, ct)
            ?? throw ApiException.NotFound("Không tìm thấy vé điện tử của đơn này.");
        if (!TicketStatuses.Contains(item.ItemStatus))
            throw ApiException.Conflict("Vé điện tử có sau khi đơn tour được thanh toán.");
        var key = RequireSigningKey(options.Value);
        var ticket = await repository.EnsureTicketAsync(item.ItemId, ct);
        var passengers = await repository.ListPassengersAsync(item.ItemId, ct);
        return new TourTicketDto(item.BookingId, item.BookingCode, item.ItemStatus, ticket.Code,
            TicketToken.Sign(ticket.Code, ticket.Version, key), item.TourCode, item.TourTitle, item.DepartureFrom,
            item.DepartureDate, item.ReturnDate, passengers);
    }

    /// <summary>Without a key no QR can be signed or checked; the rest of the site keeps working.</summary>
    public static string RequireSigningKey(TicketOptions ticket) => ticket.IsConfigured
        ? ticket.SigningKey
        : throw new ApiException(StatusCodes.Status503ServiceUnavailable, "Vé điện tử tạm thời chưa sẵn sàng.");
}
