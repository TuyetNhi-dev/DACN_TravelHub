using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Configuration;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.ServiceRequests;

namespace TravelHub.Api.Tests;

public sealed class ServiceRequestValidatorTests
{
    private static readonly DateOnly Today = new(2026, 11, 20);

    private static CreateServiceRequestRequest Request(string type, object details, string phone = "0903 123 456",
        string? email = " khach@example.com ", bool consent = true, string? name = "Nguyễn Văn A") =>
        new(type, name, phone, email, "Gọi buổi chiều", consent, null, JsonSerializer.SerializeToElement(details));

    public static TheoryData<string, object> ValidRequests => new()
    {
        { ServiceRequestType.AttractionTickets,
            new { destination = "Bà Nà Hills", visitDate = "2026-12-24", adults = 2, children = 1 } },
        { ServiceRequestType.CarRental, new { vehicleSeats = 7, passengers = 6, departDate = "2026-12-01",
            returnDate = "2026-12-03", pickupPlace = "Sân bay Tân Sơn Nhất", dropoffPlace = "Vũng Tàu",
            airportTransfer = "pickup" } },
        { ServiceRequestType.Visa, new { country = "Nhật Bản", visaType = "tourist", travelDate = "2027-03-10",
            applicants = 2 } },
        { ServiceRequestType.GroupTour, new { companyName = "Công ty ABC", groupSize = 80, startDate = "2027-04-01",
            endDate = "2027-04-03", budget = "3m_5m", programType = "team_building" } },
    };

    [Theory]
    [MemberData(nameof(ValidRequests))]
    public void Valid_requests_for_every_service_are_accepted(string type, object details)
    {
        var valid = ServiceRequestValidator.Create(Request(type, details), Today);

        Assert.Equal(type, valid.ServiceType);
        Assert.Equal("Nguyễn Văn A", valid.FullName);
        Assert.Equal("0903123456", valid.Phone);
        Assert.Equal("khach@example.com", valid.Email);
        using var stored = JsonDocument.Parse(valid.DetailsJson);
        Assert.Equal(JsonValueKind.Object, stored.RootElement.ValueKind);
    }

    [Fact]
    public void Email_is_optional_but_must_be_valid_when_given()
    {
        var details = new { country = "Thái Lan", visaType = "tourist", travelDate = "2027-01-10", applicants = 1 };
        Assert.Null(ServiceRequestValidator.Create(Request(ServiceRequestType.Visa, details, email: "  "), Today).Email);
        AssertFields(() => ServiceRequestValidator.Create(Request(ServiceRequestType.Visa, details, email: "not-an-email"),
            Today), "email");
    }

    [Fact]
    public void Contact_problems_are_reported_together()
    {
        // "esim" was dropped (SàiHành sells domestic travel only), so it is an unknown type like any other.
        AssertFields(() => ServiceRequestValidator.Create(new CreateServiceRequestRequest("esim", "Trần C", "0903123456", null,
            null, true, null, JsonSerializer.SerializeToElement(new { country = "Nhật", days = 5, simCount = 1 })), Today), "serviceType");
        var request = new CreateServiceRequestRequest("spa", " ", "12ab", null, new string('x', 1001), false, null,
            JsonSerializer.SerializeToElement(new { }));
        AssertFields(() => ServiceRequestValidator.Create(request, Today),
            "serviceType", "fullName", "phone", "note", "consent");
    }

    [Fact]
    public void Fields_that_do_not_belong_to_the_service_are_never_stored()
    {
        var details = new
        {
            country = "Úc", visaType = "business", travelDate = "2027-01-15", applicants = 1,
            passportNumber = "B1234567", idNumber = "079123456789",
        };
        var valid = ServiceRequestValidator.Create(Request(ServiceRequestType.Visa, details), Today);

        Assert.DoesNotContain("passport", valid.DetailsJson, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("B1234567", valid.DetailsJson);
        Assert.DoesNotContain("079123456789", valid.DetailsJson);
        Assert.Contains("\"visaType\":\"business\"", valid.DetailsJson);
    }

    [Fact]
    public void Missing_or_malformed_details_are_rejected()
    {
        var missing = new CreateServiceRequestRequest(ServiceRequestType.Visa, "Lê B", "0903123456", null, null, true,
            null, null);
        AssertFields(() => ServiceRequestValidator.Create(missing, Today), "details");
        AssertFields(() => ServiceRequestValidator.Create(
            Request(ServiceRequestType.Visa, new { country = "Nhật", visaType = "tourist", travelDate = "2027-01-10", applicants = "nhiều" }), Today), "details");
    }

    [Fact]
    public void Attraction_tickets_need_an_upcoming_date_and_an_adult()
    {
        AssertFields(() => ServiceRequestValidator.Create(Request(ServiceRequestType.AttractionTickets,
            new { destination = "Vinpearl", visitDate = "2026-11-19", adults = 0, children = -1 }), Today),
            "details.visitDate", "details.adults", "details.children");
        AssertFields(() => ServiceRequestValidator.Create(Request(ServiceRequestType.AttractionTickets,
            new { destination = "Vinpearl", visitDate = "2029-01-01", adults = 1 }), Today), "details.visitDate");
    }

    [Fact]
    public void Car_rental_checks_seats_dates_and_airport_choice()
    {
        // A 4-seat car (driver included) takes at most 3 passengers.
        AssertFields(() => ServiceRequestValidator.Create(Request(ServiceRequestType.CarRental, new
        {
            vehicleSeats = 4, passengers = 4, departDate = "2026-12-05", returnDate = "2026-12-04",
            pickupPlace = "Quận 1", dropoffPlace = "Đà Lạt", airportTransfer = "helicopter",
        }), Today), "details.passengers", "details.returnDate", "details.airportTransfer");
        AssertFields(() => ServiceRequestValidator.Create(Request(ServiceRequestType.CarRental, new
        {
            vehicleSeats = 5, passengers = 2, departDate = "2026-12-05", returnDate = "2027-03-01",
            pickupPlace = "Quận 1", dropoffPlace = "Đà Lạt",
        }), Today), "details.vehicleSeats", "details.returnDate");

        var noAirport = ServiceRequestValidator.Create(Request(ServiceRequestType.CarRental, new
        {
            vehicleSeats = 16, passengers = 15, departDate = "2026-12-05", returnDate = "2026-12-05",
            pickupPlace = "Quận 1", dropoffPlace = "Đà Lạt",
        }), Today);
        Assert.Contains("\"airportTransfer\":\"none\"", noAirport.DetailsJson);
    }

    [Fact]
    public void Visa_and_group_tour_ranges()
    {
        AssertFields(() => ServiceRequestValidator.Create(Request(ServiceRequestType.Visa,
            new { country = "Mỹ", visaType = "student", travelDate = "2027-01-01", applicants = 51 }), Today),
            "details.visaType", "details.applicants");
        AssertFields(() => ServiceRequestValidator.Create(Request(ServiceRequestType.GroupTour, new
        {
            companyName = "X", groupSize = 9, startDate = "2027-01-10", endDate = "2027-01-09",
            budget = "free", programType = "party",
        }), Today), "details.companyName", "details.groupSize", "details.endDate", "details.budget",
            "details.programType");
    }

    [Fact]
    public void Back_office_inputs()
    {
        Assert.Equal(ServiceRequestStatus.Contacted, ServiceRequestValidator.Status(" Contacted "));
        AssertFields(() => ServiceRequestValidator.Status("deleted"), "status");
        Assert.Equal("Đã gọi lại", ServiceRequestValidator.InternalNote("  Đã gọi lại "));
        AssertFields(() => ServiceRequestValidator.InternalNote("   "), "note");
        AssertFields(() => ServiceRequestValidator.InternalNote(new string('x', 2001)), "note");

        var filter = ServiceRequestValidator.Filter("  0903 ", "VISA", "");
        Assert.Equal(new ServiceRequestFilter("0903", ServiceRequestType.Visa, null), filter);
        AssertFields(() => ServiceRequestValidator.Filter(null, "spa", "archived"), "serviceType", "status");
    }

    [Fact]
    public void Search_text_matches_like_wildcards_literally()
    {
        Assert.Equal(@"50\%\_off\\x", ServiceRequestRepository.EscapeLike(@"50%_off\x"));
    }

    private static void AssertFields(Action act, params string[] fields)
    {
        var error = Assert.Throws<ApiValidationException>(act);
        Assert.Equal(fields.OrderBy(f => f), error.Errors.Keys.OrderBy(k => k));
    }
}

public sealed class ServiceRequestServiceTests
{
    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    // No database is configured, so any query throws DatabaseConfigurationException: a test can tell whether a
    // code path reached the database at all.
    private static ServiceRequestRepository NoDatabase() =>
        new(new MySqlConnectionFactory(Options.Create(new DatabaseOptions())));

    private static readonly VietnamClock Clock = new(new FixedTime(new DateTimeOffset(2026, 11, 20, 3, 0, 0, TimeSpan.Zero)));

    private static CreateServiceRequestRequest VisaRequest(string? website) => new(ServiceRequestType.Visa,
        "Trần C", "0903123456", null, null, true, website,
        JsonSerializer.SerializeToElement(new { country = "Nhật Bản", visaType = "tourist", travelDate = "2027-01-10", applicants = 1 }));

    [Fact]
    public async Task Honeypot_answers_like_a_success_without_storing_anything()
    {
        var service = new ServiceRequestService(NoDatabase(), Clock, NullLogger<ServiceRequestService>.Instance);

        var created = await service.CreateAsync(VisaRequest("http://spam.example"), CancellationToken.None);

        Assert.Matches("^YC261120[A-Z2-9]{6}$", created.Code);
        // The same request without the honeypot does go to the database.
        await Assert.ThrowsAsync<DatabaseConfigurationException>(
            () => service.CreateAsync(VisaRequest(null), CancellationToken.None));
    }

    [Fact]
    public void Request_codes_use_their_own_prefix_and_no_ambiguous_characters()
    {
        var code = TravelHub.Api.Features.Bookings.BookingCodeGenerator.Create(ServiceRequestLimits.CodePrefix,
            new DateOnly(2026, 11, 20));
        Assert.Matches("^YC261120[A-HJ-NP-Z2-9]{6}$", code);
        Assert.StartsWith("SH", TravelHub.Api.Features.Bookings.BookingCodeGenerator.Create(new DateOnly(2026, 11, 20)));
    }

    private static Account AccountWith(string role) => new(
        new AuthUserDto("7", "Nhân viên", "nv@example.invalid", null,
            [new RoleAssignmentDto(role, role == RoleCodes.Customer ? RoleScopes.Self : RoleScopes.Global, null, null)]),
        "hash", null, AccountStatus.Active);

    [Fact]
    public async Task Customers_are_refused_before_any_query()
    {
        var service = new AdminServiceRequestService(NoDatabase(), Clock);
        var customer = AccountWith(RoleCodes.Customer);

        var error = await Assert.ThrowsAsync<ApiException>(() => service.CountNewAsync(customer, CancellationToken.None));
        Assert.Equal(StatusCodes.Status403Forbidden, error.StatusCode);
        await Assert.ThrowsAsync<ApiException>(() => service.AddNoteAsync(customer, "1",
            new AddServiceRequestNoteRequest("x"), CancellationToken.None));

        // Staff pass the gate and reach the (unconfigured) database.
        await Assert.ThrowsAsync<DatabaseConfigurationException>(
            () => service.CountNewAsync(AccountWith(RoleCodes.Staff), CancellationToken.None));
    }
}
