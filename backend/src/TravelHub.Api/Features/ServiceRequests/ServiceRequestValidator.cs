using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Auth;
using L = TravelHub.Api.Features.ServiceRequests.ServiceRequestLimits;

namespace TravelHub.Api.Features.ServiceRequests;

/// <summary>
/// Shape and range checks for the public consultation form and the back-office actions. Pure: no I/O.
/// Details are read into the typed input of the chosen service, so fields that do not belong to it
/// (including anything like a passport or ID number) are dropped and never stored.
/// </summary>
public static class ServiceRequestValidator
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static ValidServiceRequest Create(CreateServiceRequestRequest request, DateOnly today)
    {
        var errors = new ValidationErrors();
        var type = request.ServiceType?.Trim().ToLowerInvariant();
        var knownType = type is not null && ServiceRequestType.All.Contains(type);
        errors.AddIf(!knownType, "serviceType", "Vui lòng chọn dịch vụ cần tư vấn.");
        var name = Text(request.FullName, "fullName", L.MinNameLength, L.MaxNameLength,
            $"Họ tên cần từ {L.MinNameLength} đến {L.MaxNameLength} ký tự.", errors);
        var phone = Phone(request.Phone, errors);
        var email = Email(request.Email, errors);
        var note = OptionalText(request.Note, "note", L.MaxCustomerNoteLength,
            $"Ghi chú tối đa {L.MaxCustomerNoteLength} ký tự.", errors);
        errors.AddIf(!request.Consent, "consent", "Vui lòng đồng ý để nhân viên SàiHành liên hệ tư vấn.");
        var details = knownType ? Details(type!, request.Details, today, errors) : null;
        errors.ThrowIfAny();
        return new ValidServiceRequest(type!, name!, phone!, email, note,
            JsonSerializer.Serialize(details!, details!.GetType(), Json));
    }

    public static string Status(string? raw)
    {
        var status = raw?.Trim().ToLowerInvariant();
        if (status is not null && ServiceRequestStatus.All.Contains(status)) return status;
        throw Invalid("status", "Trạng thái chỉ gồm: mới, đã liên hệ, đã đóng.");
    }

    public static string InternalNote(string? raw)
    {
        var note = raw?.Trim();
        if (note is { Length: > 0 and <= L.MaxInternalNoteLength }) return note;
        throw Invalid("note", $"Ghi chú cần từ 1 đến {L.MaxInternalNoteLength} ký tự.");
    }

    /// <summary>Back-office list filter; unknown type or status is a 400 instead of an empty list.</summary>
    public static ServiceRequestFilter Filter(string? query, string? serviceType, string? status)
    {
        var errors = new ValidationErrors();
        var q = query?.Trim();
        errors.AddIf(q is { Length: > L.MaxSearchLength }, "q", $"Từ khóa tối đa {L.MaxSearchLength} ký tự.");
        var type = Normalize(serviceType);
        errors.AddIf(type is not null && !ServiceRequestType.All.Contains(type), "serviceType", "Loại dịch vụ không hợp lệ.");
        var state = Normalize(status);
        errors.AddIf(state is not null && !ServiceRequestStatus.All.Contains(state), "status", "Trạng thái không hợp lệ.");
        errors.ThrowIfAny();
        return new ServiceRequestFilter(string.IsNullOrEmpty(q) ? null : q, type, state);
    }

    // ---- Service-specific details ---------------------------------------------------------------

    private static object? Details(string type, JsonElement? raw, DateOnly today, ValidationErrors errors) => type switch
    {
        ServiceRequestType.AttractionTickets => Read<AttractionTicketsInput>(raw, errors) is { } input
            ? Attraction(input, today, errors) : null,
        ServiceRequestType.CarRental => Read<CarRentalInput>(raw, errors) is { } input
            ? CarRental(input, today, errors) : null,
        ServiceRequestType.Visa => Read<VisaInput>(raw, errors) is { } input ? Visa(input, today, errors) : null,
        ServiceRequestType.GroupTour => Read<GroupTourInput>(raw, errors) is { } input
            ? GroupTour(input, today, errors) : null,
        _ => null,
    };

    private static AttractionTicketsDetails? Attraction(AttractionTicketsInput input, DateOnly today,
        ValidationErrors errors)
    {
        var destination = Place(input.Destination, "details.destination", "Vui lòng nhập điểm đến hoặc khu vui chơi.", errors);
        var date = UpcomingDate(input.VisitDate, "details.visitDate", today, errors);
        var adults = Count(input.Adults, "details.adults", 1, L.MaxTravelers, "Số người lớn", errors);
        var children = Count(input.Children ?? 0, "details.children", 0, L.MaxTravelers, "Số trẻ em", errors);
        return errors.HasErrors ? null : new AttractionTicketsDetails(destination!, date!.Value, adults!.Value, children!.Value);
    }

    private static CarRentalDetails? CarRental(CarRentalInput input, DateOnly today, ValidationErrors errors)
    {
        var seats = input.VehicleSeats;
        var knownSeats = seats is not null && ServiceRequestChoices.VehicleSeats.Contains(seats.Value);
        errors.AddIf(!knownSeats, "details.vehicleSeats", "Vui lòng chọn loại xe 4, 7, 16, 29 hoặc 45 chỗ.");
        // Seats include the driver.
        var maxPassengers = knownSeats ? seats!.Value - 1 : L.MaxTravelers;
        var passengers = Count(input.Passengers, "details.passengers", 1, maxPassengers, "Số khách", errors);
        var depart = UpcomingDate(input.DepartDate, "details.departDate", today, errors);
        var back = input.ReturnDate;
        errors.AddIf(back is null || (depart is not null && (back < depart || back > depart.Value.AddDays(L.MaxCarRentalDays))),
            "details.returnDate", $"Ngày về phải từ ngày đi trở đi, tối đa {L.MaxCarRentalDays} ngày.");
        var pickup = Place(input.PickupPlace, "details.pickupPlace", "Vui lòng nhập điểm đón.", errors);
        var dropoff = Place(input.DropoffPlace, "details.dropoffPlace", "Vui lòng nhập điểm đến.", errors);
        var airport = Choice(input.AirportTransfer ?? "none", ServiceRequestChoices.AirportTransfer,
            "details.airportTransfer", "Lựa chọn đón/tiễn sân bay không hợp lệ.", errors);
        return errors.HasErrors ? null
            : new CarRentalDetails(seats!.Value, passengers!.Value, depart!.Value, back!.Value, pickup!, dropoff!, airport!);
    }

    private static VisaDetails? Visa(VisaInput input, DateOnly today, ValidationErrors errors)
    {
        var country = Place(input.Country, "details.country", "Vui lòng nhập quốc gia xin visa.", errors);
        var visaType = Choice(input.VisaType, ServiceRequestChoices.VisaTypes, "details.visaType",
            "Vui lòng chọn loại visa.", errors);
        var date = UpcomingDate(input.TravelDate, "details.travelDate", today, errors);
        var applicants = Count(input.Applicants, "details.applicants", 1, L.MaxTravelers, "Số người", errors);
        return errors.HasErrors ? null : new VisaDetails(country!, visaType!, date!.Value, applicants!.Value);
    }

    private static GroupTourDetails? GroupTour(GroupTourInput input, DateOnly today, ValidationErrors errors)
    {
        var company = Place(input.CompanyName, "details.companyName", "Vui lòng nhập tên công ty hoặc tổ chức.", errors);
        var size = Count(input.GroupSize, "details.groupSize", L.MinGroupSize, L.MaxGroupSize, "Số người", errors);
        var start = UpcomingDate(input.StartDate, "details.startDate", today, errors);
        var end = input.EndDate;
        errors.AddIf(end is null || (start is not null && (end < start || end > start.Value.AddDays(L.MaxGroupTourDays))),
            "details.endDate", $"Ngày kết thúc phải từ ngày bắt đầu trở đi, tối đa {L.MaxGroupTourDays} ngày.");
        var budget = Choice(input.Budget, ServiceRequestChoices.GroupBudgets, "details.budget",
            "Vui lòng chọn ngân sách dự kiến.", errors);
        var program = Choice(input.ProgramType, ServiceRequestChoices.GroupPrograms, "details.programType",
            "Vui lòng chọn loại chương trình.", errors);
        return errors.HasErrors ? null
            : new GroupTourDetails(company!, size!.Value, start!.Value, end!.Value, budget!, program!);
    }

    // ---- Field helpers ----------------------------------------------------------------------------

    private static T? Read<T>(JsonElement? raw, ValidationErrors errors) where T : class
    {
        if (raw is not { ValueKind: JsonValueKind.Object } element)
        {
            errors.Add("details", "Thiếu thông tin chi tiết của yêu cầu.");
            return null;
        }
        try
        {
            return element.Deserialize<T>(Json);
        }
        catch (JsonException)
        {
            errors.Add("details", "Thông tin chi tiết không đúng định dạng.");
            return null;
        }
    }

    private static string? Text(string? raw, string field, int min, int max, string message, ValidationErrors errors)
    {
        var value = raw?.Trim();
        var valid = value is not null && value.Length >= min && value.Length <= max;
        errors.AddIf(!valid, field, message);
        return valid ? value : null;
    }

    private static string? OptionalText(string? raw, string field, int max, string message, ValidationErrors errors)
    {
        var value = raw?.Trim();
        if (string.IsNullOrEmpty(value)) return null;
        errors.AddIf(value.Length > max, field, message);
        return value.Length > max ? null : value;
    }

    private static string? Place(string? raw, string field, string message, ValidationErrors errors) =>
        Text(raw, field, L.MinPlaceLength, L.MaxPlaceLength, message, errors);

    private static string? Phone(string? raw, ValidationErrors errors)
    {
        var phone = PhoneNumber.NormalizeVietnamese(raw);
        errors.AddIf(phone is null, "phone", PhoneNumber.InvalidMessage);
        return phone;
    }

    private static string? Email(string? raw, ValidationErrors errors)
    {
        var email = raw?.Trim();
        if (string.IsNullOrEmpty(email)) return null;
        var valid = email.Length <= L.MaxEmailLength && new EmailAddressAttribute().IsValid(email);
        errors.AddIf(!valid, "email", "Email không hợp lệ.");
        return valid ? email : null;
    }

    private static int? Count(int? value, string field, int min, int max, string label, ValidationErrors errors)
    {
        var valid = value is not null && value >= min && value <= max;
        errors.AddIf(!valid, field, $"{label} từ {min} đến {max}.");
        return valid ? value : null;
    }

    private static DateOnly? UpcomingDate(DateOnly? value, string field, DateOnly today, ValidationErrors errors)
    {
        var valid = value is not null && value >= today && value <= today.AddDays(L.MaxDaysAhead);
        errors.AddIf(!valid, field, "Ngày phải từ hôm nay trở đi và trong vòng 2 năm.");
        return valid ? value : null;
    }

    private static string? Choice(string? raw, IReadOnlySet<string> allowed, string field, string message,
        ValidationErrors errors)
    {
        var value = Normalize(raw);
        var valid = value is not null && allowed.Contains(value);
        errors.AddIf(!valid, field, message);
        return valid ? value : null;
    }

    private static string? Normalize(string? raw)
    {
        var value = raw?.Trim().ToLowerInvariant();
        return string.IsNullOrEmpty(value) ? null : value;
    }

    private static ApiValidationException Invalid(string field, string message) =>
        new(new Dictionary<string, string[]> { [field] = [message] });
}
