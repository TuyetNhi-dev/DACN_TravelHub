using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Bookings;

public sealed record ValidPassenger(string FullName, string PassengerType, DateOnly? BirthDate);

public sealed record ValidTourRequest(ulong DepartureId, int Adults, int Children, IReadOnlyList<ValidPassenger> Passengers);

public sealed record ValidHotelRequest(ulong RoomTypeId, DateOnly CheckIn, DateOnly CheckOut, int Rooms, int Guests,
    string LeadGuestName);

public sealed record ValidFlightRequest(ulong OfferId, IReadOnlyList<ValidPassenger> Passengers);

/// <summary>Shape and range checks only; availability and prices are checked against the database.</summary>
public static class BookingRequestValidator
{
    public static ValidTourRequest Tour(CreateTourBookingRequest request)
    {
        var errors = new ValidationErrors();
        var total = request.AdultCount + request.ChildCount;
        errors.AddIf(!ResourceId.TryParse(request.DepartureId, out var departureId), "departureId",
            "Vui lòng chọn lịch khởi hành.");
        errors.AddIf(request.AdultCount < 1, "adultCount", "Cần ít nhất một người lớn.");
        errors.AddIf(request.ChildCount < 0, "childCount", "Số trẻ em không hợp lệ.");
        errors.AddIf(total > BookingLimits.MaxTourTravelers, "adultCount",
            $"Mỗi đơn tối đa {BookingLimits.MaxTourTravelers} khách. Đoàn lớn hơn vui lòng liên hệ tổng đài.");
        var passengers = Passengers(request.Passengers, errors);
        var adults = passengers.Count(p => p.PassengerType == PassengerType.Adult);
        errors.AddIf(passengers.Count != total || adults != request.AdultCount, "passengers",
            "Danh sách khách phải khớp số người lớn và trẻ em.");
        errors.ThrowIfAny();
        return new ValidTourRequest(departureId, request.AdultCount, request.ChildCount, passengers);
    }

    public static ValidHotelRequest Hotel(CreateHotelBookingRequest request, DateOnly today)
    {
        var errors = new ValidationErrors();
        errors.AddIf(!ResourceId.TryParse(request.RoomTypeId, out var roomTypeId), "roomTypeId",
            "Vui lòng chọn loại phòng.");
        errors.AddIf(request.CheckIn is null || request.CheckIn < today, "checkIn",
            "Ngày nhận phòng phải từ hôm nay trở đi.");
        var nights = request is { CheckIn: { } start, CheckOut: { } end } ? BookingPricing.Nights(start, end) : 0;
        errors.AddIf(nights is < 1 or > BookingLimits.MaxNights, "checkOut",
            $"Ngày trả phòng phải sau ngày nhận phòng, tối đa {BookingLimits.MaxNights} đêm.");
        errors.AddIf(request.RoomCount is < 1 or > BookingLimits.MaxRooms, "roomCount",
            $"Số phòng từ 1 đến {BookingLimits.MaxRooms}.");
        errors.AddIf(request.GuestCount < request.RoomCount || request.GuestCount < 1, "guestCount",
            "Mỗi phòng cần ít nhất một khách.");
        var name = ValidName(request.LeadGuestName, "leadGuestName", errors);
        errors.ThrowIfAny();
        return new ValidHotelRequest(roomTypeId, request.CheckIn!.Value, request.CheckOut!.Value,
            request.RoomCount, request.GuestCount, name!);
    }

    public static ValidFlightRequest Flight(CreateFlightBookingRequest request)
    {
        var errors = new ValidationErrors();
        errors.AddIf(!ResourceId.TryParse(request.OfferId, out var offerId), "offerId", "Vui lòng chọn chuyến bay.");
        var passengers = Passengers(request.Passengers, errors);
        errors.AddIf(passengers.Count is < 1 or > BookingLimits.MaxFlightPassengers, "passengers",
            $"Mỗi đơn từ 1 đến {BookingLimits.MaxFlightPassengers} hành khách.");
        errors.AddIf(passengers.Count > 0 && passengers.All(p => p.PassengerType != PassengerType.Adult),
            "passengers", "Cần ít nhất một hành khách người lớn.");
        errors.ThrowIfAny();
        return new ValidFlightRequest(offerId, passengers);
    }

    private static List<ValidPassenger> Passengers(IReadOnlyList<PassengerInput>? input, ValidationErrors errors)
    {
        var result = new List<ValidPassenger>();
        foreach (var (passenger, index) in (input ?? []).Select((p, i) => (p, i)))
        {
            var field = $"passengers[{index}]";
            var name = ValidName(passenger.FullName, field + ".fullName", errors);
            var type = passenger.PassengerType?.Trim().ToLowerInvariant();
            var knownType = type is PassengerType.Adult or PassengerType.Child;
            errors.AddIf(!knownType, field + ".passengerType", "Loại khách chỉ gồm người lớn hoặc trẻ em.");
            if (name is not null && knownType) result.Add(new ValidPassenger(name, type!, passenger.BirthDate));
        }
        return result;
    }

    private static string? ValidName(string? raw, string field, ValidationErrors errors)
    {
        var name = raw?.Trim();
        var valid = name is { Length: >= BookingLimits.MinNameLength and <= BookingLimits.MaxNameLength };
        errors.AddIf(!valid, field, "Họ tên cần từ 2 đến 160 ký tự.");
        return valid ? name : null;
    }
}
