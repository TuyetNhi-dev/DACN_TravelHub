namespace TravelHub.Api.Features.Bookings;

public static class BookingMapper
{
    public static BookingDetailDto ToDetail(BookingDetailRow row, bool canCancel, bool canPay, bool includeCustomer)
    {
        var summary = row.Summary;
        return new BookingDetailDto(
            summary.Id,
            summary.Code,
            summary.ServiceType,
            summary.Status,
            summary.ItemStatus,
            summary.Title,
            summary.Subtitle,
            summary.StartDate,
            row.Snapshot?.EndDate,
            row.Subtotal,
            row.DiscountTotal,
            summary.Total,
            row.ConfirmationCode,
            row.Snapshot?.Terms,
            summary.CreatedAt,
            summary.HoldExpiresAt,
            row.PaidAt,
            row.Snapshot?.PriceLines ?? [],
            row.Passengers,
            includeCustomer ? summary.Customer : null,
            canCancel,
            canPay);
    }
}
