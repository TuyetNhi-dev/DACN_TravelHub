using System.Globalization;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;
using TravelHub.Api.Features.Admin.Departures;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Features.Admin.CheckIn;

/// <summary>Pure check-in rules (no database), unit-tested.</summary>
public static class CheckInRules
{
    /// <summary>Groups gathering the evening before an early departure can already be checked in.</summary>
    public const int OpenDaysBeforeDeparture = 1;
    /// <summary>One request checks in at most one order's travellers.</summary>
    public const int MaxPassengersPerRequest = BookingLimits.MaxTourTravelers;

    /// <summary>Null while check-in is open; otherwise the Vietnamese reason shown on the board.</summary>
    public static string? ClosedReason(DateOnly today, AdminDepartureDto departure)
    {
        if (departure.Status == DepartureStatus.Cancelled) return "Lịch khởi hành đã hủy, không thể check-in.";
        if (departure.Status == DepartureStatus.Completed) return "Chuyến đi đã kết thúc.";
        var opens = departure.DepartureDate.AddDays(-OpenDaysBeforeDeparture);
        if (today < opens) return $"Check-in mở từ ngày {opens.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)}.";
        return today > departure.ReturnDate ? "Đã qua ngày về của chuyến đi." : null;
    }

    public static void EnsureOpen(DateOnly today, AdminDepartureDto departure)
    {
        if (ClosedReason(today, departure) is { } reason) throw ApiException.Conflict(reason);
    }

    /// <summary>Distinct passenger ids, 1 to MaxPassengersPerRequest of them (400 otherwise).</summary>
    public static IReadOnlyList<ulong> PassengerIds(CheckInRequest request)
    {
        var raw = request.PassengerIds ?? [];
        var errors = new ValidationErrors();
        errors.AddIf(raw.Count == 0, "passengerIds", "Chọn ít nhất một hành khách.");
        errors.AddIf(raw.Count > MaxPassengersPerRequest, "passengerIds",
            $"Mỗi lần check-in tối đa {MaxPassengersPerRequest} hành khách.");
        errors.AddIf(raw.Any(id => !ResourceId.TryParse(id, out _)), "passengerIds", "Mã hành khách không hợp lệ.");
        errors.ThrowIfAny();
        return raw.Select(id => ResourceId.Parse(id, "passengerIds")).Distinct().ToList();
    }

    /// <summary>Why a signed ticket cannot board this departure; null when it can.</summary>
    public static string? TicketProblem(TicketLookupRow ticket, int scannedVersion, ulong departureId)
    {
        if (ticket.Version != scannedVersion) return "Vé này đã được cấp lại; mã QR cũ không còn hiệu lực.";
        if (ticket.DepartureId != departureId) return "Vé thuộc một lịch khởi hành khác.";
        return ticket.ItemStatus == BookingItemStatus.Confirmed ? null : "Đơn của vé này chưa thanh toán hoặc đã hủy.";
    }

    public static string Summary(string verb, int count, string bookingCode, AdminDepartureDto departure) =>
        $"{verb} {count} khách của đơn {bookingCode} (tour {departure.TourCode}, khởi hành "
        + $"{departure.DepartureDate.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)})";
}
