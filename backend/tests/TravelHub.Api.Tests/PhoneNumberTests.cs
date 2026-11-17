using TravelHub.Api.Features.Auth;

namespace TravelHub.Api.Tests;

public sealed class PhoneNumberTests
{
    [Theory]
    [InlineData("0367210722")]
    [InlineData("+84367210722")]
    [InlineData(" 0901234567 ")]
    [InlineData("123456789")]
    public void Accepts_9_to_15_digits_with_optional_plus(string phone) => Assert.True(PhoneNumber.IsValid(phone));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("12345678")]
    [InlineData("1234567890123456")]
    [InlineData("090 123 4567")]
    [InlineData("090-123-4567")]
    [InlineData("++84367210722")]
    public void Rejects_anything_else(string? phone) => Assert.False(PhoneNumber.IsValid(phone));
}
