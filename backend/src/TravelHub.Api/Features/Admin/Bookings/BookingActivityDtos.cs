using TravelHub.Api.Common.Errors;

namespace TravelHub.Api.Features.Admin.Bookings;

public sealed record BookingPaymentDto(string Id, string Provider, decimal Amount, string Status, DateTime? PaidAt,
    DateTime CreatedAt);

/// <summary>One line of "Lịch sử": the order's creation, then every back-office change from audit_logs.</summary>
public sealed record BookingHistoryDto(DateTime At, string ActorName, string Action, string Summary);

public sealed record BookingNoteDto(string Id, string AuthorName, string Text, DateTime CreatedAt);

public sealed record BookingActivityDto(IReadOnlyList<BookingPaymentDto> Payments,
    IReadOnlyList<BookingHistoryDto> History, IReadOnlyList<BookingNoteDto> Notes);

public sealed record BookingNoteRequest(string? Text);

/// <summary>Internal notes are for staff only and never shown to the customer.</summary>
public static class BookingNoteRules
{
    public const int MaxLength = 1000;
    public const string CreatedAction = "booking.created";

    public static string Validate(BookingNoteRequest request)
    {
        var text = request.Text?.Trim() ?? "";
        var errors = new ValidationErrors();
        errors.AddIf(text.Length == 0, "text", "Vui lòng nhập nội dung ghi chú.");
        errors.AddIf(text.Length > MaxLength, "text", $"Ghi chú tối đa {MaxLength} ký tự.");
        errors.ThrowIfAny();
        return text;
    }

    /// <summary>Puts the creation first so the history reads from the beginning of the order.</summary>
    public static IReadOnlyList<BookingHistoryDto> History(DateTime createdAt, string customerName,
        IEnumerable<BookingHistoryDto> changes) =>
        [new BookingHistoryDto(createdAt, customerName, CreatedAction, "Khách tạo đơn"), ..changes.OrderBy(h => h.At)];
}
