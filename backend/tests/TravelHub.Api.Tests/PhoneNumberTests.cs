using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Tests;

/// <summary>One Vietnamese phone rule for sign-up, the saved contact phone and service requests.</summary>
public sealed class PhoneNumberTests
{
    [Theory]
    [InlineData("0912345678", "0912345678")]
    [InlineData("0912 345 678", "0912345678")]
    [InlineData("091.234.5678", "0912345678")]
    [InlineData("+84 912-345-678", "0912345678")]
    [InlineData("84912345678", "0912345678")]
    [InlineData("0283 812 3456", "02838123456")]
    [InlineData("(028) 3812 3456", "02838123456")]
    [InlineData(" 0367210722 ", "0367210722")]
    public void Vietnamese_mobiles_and_landlines_are_stored_as_0_digits(string input, string stored) =>
        Assert.Equal(stored, PhoneNumber.NormalizeVietnamese(input));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("123456789")]
    [InlineData("0112345678")]
    [InlineData("091234567")]
    [InlineData("09123456789")]
    [InlineData("+1 415 555 0100")]
    [InlineData("0912abc678")]
    [InlineData("++84912345678")]
    public void Anything_else_is_refused(string? input) => Assert.Null(PhoneNumber.NormalizeVietnamese(input));
}
