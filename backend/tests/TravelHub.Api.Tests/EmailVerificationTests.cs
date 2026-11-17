using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Auth.EmailVerification;

namespace TravelHub.Api.Tests;

public sealed class EmailVerificationTests
{
    [Fact]
    public void Codes_are_six_digits_including_leading_zeros()
    {
        for (var i = 0; i < 200; i++)
        {
            var code = VerificationCode.Create();
            Assert.Matches("^[0-9]{6}$", code);
            Assert.True(VerificationCode.HasValidShape(code));
        }
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("12345")]
    [InlineData("1234567")]
    [InlineData("12a456")]
    [InlineData("١٢٣٤٥٦")]
    public void Malformed_codes_are_rejected_before_any_lookup(string? code) =>
        Assert.False(VerificationCode.HasValidShape(code));

    [Fact]
    public void Hash_is_bound_to_the_user_so_equal_codes_never_collide()
    {
        var first = VerificationCode.Hash(1, "123456");
        Assert.NotEqual(first, VerificationCode.Hash(2, "123456"));
        Assert.Matches("^[0-9a-f]{64}$", first);
        Assert.DoesNotContain("123456", first);
    }

    [Fact]
    public void Matches_accepts_only_the_right_code_for_the_right_user()
    {
        var stored = VerificationCode.Hash(7, "004211");
        Assert.True(VerificationCode.Matches(stored, 7, "004211"));
        Assert.False(VerificationCode.Matches(stored, 7, "004212"));
        Assert.False(VerificationCode.Matches(stored, 8, "004211"));
    }

    [Fact]
    public void Email_shows_the_code_and_escapes_the_name()
    {
        var message = VerificationEmail.Build("an@example.com", "<b>An</b>", "004211", "https://saihanh.test/");
        Assert.Contains("004211", message.Subject);
        Assert.Contains("004211", message.TextBody);
        Assert.Contains("https://saihanh.test/verify-email", message.TextBody);
        Assert.DoesNotContain("<b>An</b>", message.HtmlBody);
        Assert.Contains("&lt;b&gt;An&lt;/b&gt;", message.HtmlBody);
    }

    [Fact]
    public void Google_only_accounts_are_active_and_have_a_session_stamp()
    {
        var user = new AuthUserDto("1", "An", "an@example.com", null, []);
        var google = new Account(user, null, "google-sub", AccountStatus.Active);
        Assert.True(google.IsActive);
        Assert.NotEqual(google.CredentialStamp, (google with { GoogleSubject = "other" }).CredentialStamp);
        Assert.False(new Account(user, null, null, AccountStatus.Active).IsActive);
        Assert.False((google with { Status = AccountStatus.Pending }).IsActive);
    }
}
