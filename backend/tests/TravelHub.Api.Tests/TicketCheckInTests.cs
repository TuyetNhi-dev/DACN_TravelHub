using TravelHub.Api.Common.Errors;
using TravelHub.Api.Configuration;
using TravelHub.Api.Features.Admin.CheckIn;
using TravelHub.Api.Features.Admin.Departures;
using TravelHub.Api.Features.Bookings;
using TravelHub.Api.Features.Tickets;

namespace TravelHub.Api.Tests;

/// <summary>E-ticket QR signing and the pure check-in rules (migration 017). No database, fake keys only.</summary>
public sealed class TicketCheckInTests
{
    // Fake keys used only by these tests.
    private const string Key = "FAKE-TICKET-SIGNING-KEY-FOR-TESTS-0001";
    private const string OtherKey = "FAKE-TICKET-SIGNING-KEY-FOR-TESTS-0002";
    private const string Code = "7K2M9QXH4TBW";

    private static AdminDepartureDto Departure(string status = DepartureStatus.Guaranteed) => new("5", "1", "DL01",
        "Đà Lạt 3 ngày", "2", "Chi nhánh HCM", "3", "Hồ Chí Minh", new DateOnly(2026, 12, 10),
        new DateOnly(2026, 12, 12), 30, 10, 10, 2_000_000m, null, status, false);

    [Fact]
    public void Signed_payload_verifies_and_carries_no_personal_data()
    {
        var payload = TicketToken.Sign(Code, 1, Key);
        Assert.StartsWith($"SH1.{Code}.1.", payload);
        Assert.True(payload.Length <= TicketToken.MaxPayloadLength);
        Assert.Equal(new TicketClaim(Code, 1), TicketToken.Verify(payload, Key));
    }

    [Theory]
    [InlineData("SH1.7K2M9QXH4TBW.2.")] // version changed, signature of version 1 appended below
    [InlineData("SH2.7K2M9QXH4TBW.1.")] // other prefix
    [InlineData("SH1.7K2M9QXH4TBX.1.")] // other code
    public void Tampered_payload_is_refused(string tamperedBody)
    {
        var signature = TicketToken.Sign(Code, 1, Key).Split('.')[3];
        Assert.Null(TicketToken.Verify(tamperedBody + signature, Key));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("https://example.com")]
    [InlineData("SH1.7K2M9QXH4TBW.0.abc")]
    [InlineData("SH1.7K2M9QXH4TBW.01.abc")]
    [InlineData("SH1.7k2m9qxh4tbw.1.abc")]
    public void Malformed_payload_is_refused(string? payload) => Assert.Null(TicketToken.Verify(payload, Key));

    [Fact]
    public void Payload_signed_with_another_key_or_too_long_is_refused()
    {
        Assert.Null(TicketToken.Verify(TicketToken.Sign(Code, 1, OtherKey), Key));
        Assert.Null(TicketToken.Verify(new string('A', TicketToken.MaxPayloadLength + 1), Key));
    }

    [Fact]
    public void New_codes_are_random_and_use_the_unambiguous_alphabet()
    {
        var codes = Enumerable.Range(0, 200).Select(_ => TicketToken.NewCode()).ToList();
        Assert.Equal(codes.Count, codes.Distinct().Count());
        Assert.All(codes, code =>
        {
            Assert.Equal(TicketToken.CodeLength, code.Length);
            Assert.DoesNotContain(code, c => "ILOU".Contains(c) || char.IsLower(c));
            Assert.NotNull(TicketToken.Verify(TicketToken.Sign(code, 3, Key), Key));
        });
    }

    [Fact]
    public void Signing_key_must_be_long_enough()
    {
        Assert.False(new TicketOptions { SigningKey = "short" }.IsConfigured);
        Assert.True(new TicketOptions { SigningKey = Key }.IsConfigured);
        var error = Assert.Throws<ApiException>(() => TicketService.RequireSigningKey(new TicketOptions()));
        Assert.Equal(503, error.StatusCode);
    }

    [Theory]
    [InlineData("2026-12-08", false)]
    [InlineData("2026-12-09", true)]
    [InlineData("2026-12-12", true)]
    [InlineData("2026-12-13", false)]
    public void Check_in_opens_the_day_before_and_closes_after_return(string today, bool open)
    {
        var reason = CheckInRules.ClosedReason(DateOnly.Parse(today), Departure());
        Assert.Equal(open, reason is null);
        if (DateOnly.Parse(today) < new DateOnly(2026, 12, 9)) Assert.Contains("09/12/2026", reason);
    }

    [Theory]
    [InlineData(DepartureStatus.Cancelled)]
    [InlineData(DepartureStatus.Completed)]
    public void Cancelled_or_completed_departures_are_closed(string status)
    {
        var departure = Departure(status);
        Assert.NotNull(CheckInRules.ClosedReason(new DateOnly(2026, 12, 10), departure));
        var error = Assert.Throws<ApiException>(() => CheckInRules.EnsureOpen(new DateOnly(2026, 12, 10), departure));
        Assert.Equal(409, error.StatusCode);
    }

    [Fact]
    public void Ticket_must_match_version_departure_and_be_paid()
    {
        var paid = new TicketLookupRow("9", 2, BookingItemStatus.Confirmed, 5);
        Assert.Null(CheckInRules.TicketProblem(paid, 2, 5));
        Assert.Contains("cấp lại", CheckInRules.TicketProblem(paid, 1, 5));
        Assert.Contains("lịch khởi hành khác", CheckInRules.TicketProblem(paid, 2, 6));
        Assert.NotNull(CheckInRules.TicketProblem(paid with { ItemStatus = BookingItemStatus.Cancelled }, 2, 5));
        Assert.NotNull(CheckInRules.TicketProblem(paid with { ItemStatus = BookingItemStatus.Pending }, 2, 5));
    }

    [Fact]
    public void Passenger_ids_are_validated_and_deduplicated()
    {
        Assert.Equal([3UL, 4UL], CheckInRules.PassengerIds(new CheckInRequest(["3", "4", "3"])));
        Assert.Throws<ApiValidationException>(() => CheckInRules.PassengerIds(new CheckInRequest(null)));
        Assert.Throws<ApiValidationException>(() => CheckInRules.PassengerIds(new CheckInRequest(["x"])));
        Assert.Throws<ApiValidationException>(() => CheckInRules.PassengerIds(new CheckInRequest(["0"])));
        var tooMany = Enumerable.Range(1, CheckInRules.MaxPassengersPerRequest + 1).Select(i => i.ToString()).ToList();
        Assert.Throws<ApiValidationException>(() => CheckInRules.PassengerIds(new CheckInRequest(tooMany)));
    }

    [Fact]
    public void Audit_summary_names_the_order_but_no_passenger()
    {
        var summary = CheckInRules.Summary("Check-in", 2, "SH261210ABCD", Departure());
        Assert.Equal("Check-in 2 khách của đơn SH261210ABCD (tour DL01, khởi hành 10/12/2026)", summary);
    }
}
