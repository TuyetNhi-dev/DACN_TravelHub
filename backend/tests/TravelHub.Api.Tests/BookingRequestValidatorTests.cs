using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Bookings;

namespace TravelHub.Api.Tests;

public sealed class BookingRequestValidatorTests
{
    private static readonly DateOnly Today = new(2026, 11, 16);

    private static PassengerInput Adult(string name = "Nguyễn Văn An") => new(name, PassengerType.Adult, null);
    private static PassengerInput Child(string name = "Nguyễn Bảo Ngọc") => new(name, PassengerType.Child, null);

    [Fact]
    public void Tour_accepts_matching_passenger_list()
    {
        var result = BookingRequestValidator.Tour(new CreateTourBookingRequest("12", 1, 1, [Adult(), Child()]));

        Assert.Equal(12UL, result.DepartureId);
        Assert.Equal(2, result.Passengers.Count);
    }

    [Fact]
    public void Tour_rejects_passenger_list_that_does_not_match_counts()
    {
        var error = Assert.Throws<ApiValidationException>(() =>
            BookingRequestValidator.Tour(new CreateTourBookingRequest("12", 2, 0, [Adult()])));

        Assert.Contains("passengers", error.Errors.Keys);
    }

    [Fact]
    public void Tour_requires_at_least_one_adult_and_a_valid_departure()
    {
        var error = Assert.Throws<ApiValidationException>(() =>
            BookingRequestValidator.Tour(new CreateTourBookingRequest("abc", 0, 1, [Child()])));

        Assert.Contains("departureId", error.Errors.Keys);
        Assert.Contains("adultCount", error.Errors.Keys);
    }

    [Fact]
    public void Tour_rejects_groups_above_the_online_limit()
    {
        var passengers = Enumerable.Range(0, 21).Select(_ => Adult()).ToList();

        Assert.Throws<ApiValidationException>(() =>
            BookingRequestValidator.Tour(new CreateTourBookingRequest("1", 21, 0, passengers)));
    }

    [Fact]
    public void Hotel_rejects_check_in_in_the_past()
    {
        var request = new CreateHotelBookingRequest("5", Today.AddDays(-1), Today.AddDays(1), 1, 2, "Trần Thị Bình");

        var error = Assert.Throws<ApiValidationException>(() => BookingRequestValidator.Hotel(request, Today));

        Assert.Contains("checkIn", error.Errors.Keys);
    }

    [Fact]
    public void Hotel_rejects_stays_longer_than_the_limit_and_rooms_without_guests()
    {
        var request = new CreateHotelBookingRequest("5", Today, Today.AddDays(31), 3, 2, "Trần Thị Bình");

        var error = Assert.Throws<ApiValidationException>(() => BookingRequestValidator.Hotel(request, Today));

        Assert.Contains("checkOut", error.Errors.Keys);
        Assert.Contains("guestCount", error.Errors.Keys);
    }

    [Fact]
    public void Hotel_accepts_a_valid_stay()
    {
        var request = new CreateHotelBookingRequest("5", Today, Today.AddDays(2), 1, 2, "  Trần Thị Bình  ");

        var result = BookingRequestValidator.Hotel(request, Today);

        Assert.Equal("Trần Thị Bình", result.LeadGuestName);
    }

    [Fact]
    public void Flight_requires_an_adult_passenger()
    {
        var error = Assert.Throws<ApiValidationException>(() =>
            BookingRequestValidator.Flight(new CreateFlightBookingRequest("9", [Child()])));

        Assert.Contains("passengers", error.Errors.Keys);
    }

    [Fact]
    public void Flight_rejects_unknown_passenger_types()
    {
        var infant = new PassengerInput("Lê Minh", "infant", null);

        var error = Assert.Throws<ApiValidationException>(() =>
            BookingRequestValidator.Flight(new CreateFlightBookingRequest("9", [Adult(), infant])));

        Assert.Contains("passengers[1].passengerType", error.Errors.Keys);
    }
}
