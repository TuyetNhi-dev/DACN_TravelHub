using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TravelHub.Api.Common.Email;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Time;
using TravelHub.Api.Configuration;
using TravelHub.Api.Data;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Auth.EmailVerification;
using TravelHub.Api.Features.Auth.PasswordReset;

namespace TravelHub.Api.Tests;

public sealed class RegistrationRulesTests
{
    private static RegisterRequest Form(bool terms = true, string? phone = null, string password = "mat-khau-du-dai",
        string? confirm = null) => new("Nguyễn Văn An", "an@example.com", password, confirm ?? password, terms, phone);

    [Fact]
    public void Sign_up_without_ticking_the_agreement_is_refused()
    {
        var error = Assert.Throws<ApiValidationException>(() => AuthService.ValidateRegistration(Form(terms: false)));
        Assert.Equal(["acceptTerms"], error.Errors.Keys);
        Assert.Contains("Chính sách bảo vệ dữ liệu cá nhân", error.Errors["acceptTerms"][0]);
    }

    [Fact]
    public void Phone_is_optional_but_must_be_vietnamese_when_given()
    {
        Assert.Null(AuthService.ValidateRegistration(Form(phone: null)));
        Assert.Null(AuthService.ValidateRegistration(Form(phone: "   ")));
        Assert.Equal("0912345678", AuthService.ValidateRegistration(Form(phone: "+84 912 345 678")));
        var error = Assert.Throws<ApiValidationException>(() => AuthService.ValidateRegistration(Form(phone: "12345")));
        Assert.Equal(["phone"], error.Errors.Keys);
    }

    [Fact]
    public void Password_rules_are_shared_with_password_reset()
    {
        var shortPassword = Assert.Throws<ApiValidationException>(
            () => AuthService.ValidateRegistration(Form(password: "ngan")));
        Assert.Contains("password", shortPassword.Errors.Keys);
        var mismatch = Assert.Throws<ApiValidationException>(
            () => AuthService.ValidateRegistration(Form(confirm: "khac-hoan-toan")));
        Assert.Equal(["confirmPassword"], mismatch.Errors.Keys);

        var reset = Assert.Throws<ApiValidationException>(() => PasswordResetService.Validate(
            new PasswordResetConfirmRequest("an@example.com", "123456", "ngan", "ngan")));
        Assert.Equal(["newPassword"], reset.Errors.Keys);
    }
}

public sealed class PasswordResetTests
{
    private static readonly AuthUserDto User = new("7", "An", "an@example.com", null, []);

    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class NoMail : IEmailSender
    {
        public int Sent { get; private set; }
        public Task<bool> SendAsync(EmailMessage message, CancellationToken ct)
        {
            Sent++;
            return Task.FromResult(true);
        }
    }

    // No database is configured, so any query throws DatabaseConfigurationException: a test can tell whether a
    // code path reached the database at all.
    private static MySqlConnectionFactory NoDatabase() => new(Options.Create(new DatabaseOptions()));

    private static PasswordResetService Service(NoMail? mail = null) => new(
        new EmailVerificationRepository(NoDatabase()), new AuthRepository(NoDatabase()),
        new PasswordHasher<string>(), mail ?? new NoMail(), Options.Create(new EmailOptions()),
        new VietnamClock(new FixedTime(new DateTimeOffset(2026, 11, 21, 3, 0, 0, TimeSpan.Zero))));

    [Fact]
    public void Active_google_only_and_unconfirmed_accounts_may_reset_but_locked_or_unknown_ones_may_not()
    {
        Assert.True(PasswordResetRules.CanReset(new Account(User, "hash", null, AccountStatus.Active)));
        Assert.True(PasswordResetRules.CanReset(new Account(User, null, "google-sub", AccountStatus.Active)));
        Assert.True(PasswordResetRules.CanReset(new Account(User, "hash", null, AccountStatus.Pending)));
        Assert.False(PasswordResetRules.CanReset(new Account(User, "hash", null, "disabled")));
        Assert.False(PasswordResetRules.CanReset(null));
    }

    [Theory]
    [InlineData(0, 0, true)]
    [InlineData(0, 4, true)]
    [InlineData(1, 1, false)]
    [InlineData(0, 5, false)]
    public void One_code_per_cooldown_and_five_per_hour(int inCooldown, int inHour, bool allowed) =>
        Assert.Equal(allowed, PasswordResetRules.MayIssue(inCooldown, inHour));

    [Theory]
    [InlineData(null, "123456")]
    [InlineData("not-an-email", "123456")]
    [InlineData("an@example.com", "12345")]
    [InlineData("an@example.com", "abcdef")]
    public async Task Malformed_confirmations_are_refused_before_any_query(string? email, string code)
    {
        await Assert.ThrowsAsync<ApiValidationException>(() => Service().ConfirmAsync(
            new PasswordResetConfirmRequest(email, code, "mat-khau-moi-du-dai", "mat-khau-moi-du-dai"),
            CancellationToken.None));
    }

    [Fact]
    public async Task A_well_formed_request_or_confirmation_looks_the_account_up()
    {
        var mail = new NoMail();
        await Assert.ThrowsAsync<ApiException>(
            () => Service(mail).RequestAsync(new PasswordResetRequest("khong-phai-email"), CancellationToken.None));
        await Assert.ThrowsAsync<DatabaseConfigurationException>(
            () => Service(mail).RequestAsync(new PasswordResetRequest("an@example.com"), CancellationToken.None));
        await Assert.ThrowsAsync<DatabaseConfigurationException>(() => Service(mail).ConfirmAsync(
            new PasswordResetConfirmRequest("an@example.com", "123456", "mat-khau-moi-du-dai", "mat-khau-moi-du-dai"),
            CancellationToken.None));
        Assert.Equal(0, mail.Sent);
    }

    [Fact]
    public void The_answer_never_says_whether_the_email_exists_or_how_many_tries_are_left()
    {
        Assert.StartsWith("Nếu email đã đăng ký", PasswordResetService.RequestMessage);
        Assert.DoesNotContain("lần", PasswordResetService.InvalidCode);
    }

    [Fact]
    public void A_new_password_changes_the_session_stamp_so_old_sessions_end()
    {
        var hasher = new PasswordHasher<string>();
        var before = new Account(User, hasher.HashPassword("an@example.com", "mat-khau-cu-du-dai"), null,
            AccountStatus.Active);
        var after = before with { PasswordHash = hasher.HashPassword("an@example.com", "mat-khau-moi-du-dai") };
        Assert.NotEqual(before.CredentialStamp, after.CredentialStamp);
        // A Google-only account that sets its first password gets a new stamp too.
        var googleOnly = new Account(User, null, "google-sub", AccountStatus.Active);
        Assert.NotEqual(googleOnly.CredentialStamp, (googleOnly with { PasswordHash = "hash" }).CredentialStamp);
    }

    [Fact]
    public void The_reset_email_shows_the_code_links_the_reset_page_and_escapes_the_name()
    {
        var message = VerificationEmail.BuildPasswordReset("an@example.com", "<b>An</b>", "004211",
            "https://saihanh.test/");
        Assert.Contains("004211", message.Subject);
        Assert.Contains("đặt lại mật khẩu", message.Subject);
        Assert.Contains("https://saihanh.test/quen-mat-khau", message.TextBody);
        Assert.DoesNotContain("<b>An</b>", message.HtmlBody);
        Assert.DoesNotContain("/verify-email", message.TextBody);
    }
}

public sealed class TermsGateTests
{
    private static readonly AuthUserDto User = new("7", "An", "an@example.com", null, []);

    private static DefaultHttpContext SignedIn(DateTime? termsAcceptedAt)
    {
        var http = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "7")], "cookie")),
            RequestServices = new ServiceCollection().AddLogging().BuildServiceProvider(),
        };
        http.Response.Body = new MemoryStream();
        http.Items[typeof(Account)] = new Account(User, "hash", null, AccountStatus.Active, termsAcceptedAt);
        return http;
    }

    private static async Task<bool> Allowed(HttpContext http)
    {
        var requirement = new TermsAcceptedRequirement();
        var context = new AuthorizationHandlerContext([requirement], http.User, http);
        await new TermsAcceptedHandler().HandleAsync(context);
        return context.HasSucceeded;
    }

    [Fact]
    public async Task Signed_in_features_need_a_stored_agreement()
    {
        Assert.True(await Allowed(SignedIn(new DateTime(2026, 11, 21, 3, 0, 0, DateTimeKind.Utc))));
        Assert.False(await Allowed(SignedIn(null)));
        var noAccount = SignedIn(null);
        noAccount.Items.Clear();
        Assert.False(await Allowed(noAccount));
    }

    [Fact]
    public async Task A_missing_agreement_answers_403_with_the_terms_required_code()
    {
        var http = SignedIn(null);
        var failure = AuthorizationFailure.Failed([new TermsAcceptedRequirement()]);
        await new TermsAwareAuthorizationResultHandler().HandleAsync(_ => Task.CompletedTask, http,
            new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build(),
            PolicyAuthorizationResult.Forbid(failure));

        Assert.Equal(StatusCodes.Status403Forbidden, http.Response.StatusCode);
        http.Response.Body.Position = 0;
        using var body = await JsonDocument.ParseAsync(http.Response.Body);
        Assert.Equal(AuthErrorCodes.TermsRequired, body.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public void The_session_tells_the_browser_whether_the_user_has_agreed()
    {
        var pending = new Account(User, "hash", null, AccountStatus.Active);
        Assert.False(pending.HasAcceptedTerms);
        Assert.True((pending with { TermsAcceptedAt = DateTime.UtcNow }).HasAcceptedTerms);
    }

    [Fact]
    public async Task Accept_terms_without_ticking_the_box_is_refused_before_any_query()
    {
        var connections = new MySqlConnectionFactory(Options.Create(new DatabaseOptions()));
        var verification = new EmailVerificationService(new EmailVerificationRepository(connections),
            new AuthRepository(connections), new NullEmailSender(), Options.Create(new EmailOptions()),
            new VietnamClock(TimeProvider.System));
        var hasher = new PasswordHasher<string>();
        var service = new AuthService(new AuthRepository(connections), hasher, new DummyPasswordHash(hasher),
            verification, new VietnamClock(TimeProvider.System));

        await Assert.ThrowsAsync<ApiValidationException>(
            () => service.AcceptTermsAsync(7, new AcceptTermsRequest(false), CancellationToken.None));
        await Assert.ThrowsAsync<DatabaseConfigurationException>(
            () => service.AcceptTermsAsync(7, new AcceptTermsRequest(true), CancellationToken.None));
    }

    private sealed class NullEmailSender : IEmailSender
    {
        public Task<bool> SendAsync(EmailMessage message, CancellationToken ct) => Task.FromResult(false);
    }
}
