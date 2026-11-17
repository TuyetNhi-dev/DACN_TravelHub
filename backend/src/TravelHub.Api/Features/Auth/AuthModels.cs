namespace TravelHub.Api.Features.Auth;

/// <summary>Sign-up asks for the email only; the contact phone is saved at the first booking.</summary>
public sealed record RegisterRequest(string? FullName, string? Email, string? Password, string? ConfirmPassword,
    bool AcceptTerms = false);

/// <summary>Credential is the Google ID token (a JWT) returned by Google Identity Services in the browser.</summary>
public sealed record GoogleSignInRequest(string? Credential);

public sealed record LoginRequest(string? Email, string? Password);

public sealed record VerifyEmailRequest(string? Email, string? Code);

public sealed record ResendVerificationRequest(string? Email);

public sealed record UpdatePhoneRequest(string? Phone);

/// <summary>EmailSent is false when the account exists but the mail server could not be reached.</summary>
public sealed record RegisterResponse(string Message, bool EmailSent);

public sealed record RoleAssignmentDto(string Code, string Scope, string? RegionId, string? BranchId);

public sealed record AuthUserDto(string Id, string FullName, string Email, string? Phone,
    IReadOnlyList<RoleAssignmentDto> Roles);

public sealed record SessionDto(AuthUserDto User, DateTimeOffset? ExpiresAt);

public sealed record CsrfTokenDto(string? Token);

public sealed record GoogleConfigDto(string? ClientId);

/// <summary>Row for a new customer. Exactly one of PasswordHash and GoogleSubject is set.</summary>
public sealed record NewCustomer(string FullName, string Email, string? Phone, string? PasswordHash,
    string? GoogleSubject, string Status);

/// <summary>Account as loaded for authentication; the hash and Google id never leave the backend.</summary>
public sealed record Account(AuthUserDto User, string? PasswordHash, string? GoogleSubject, string Status)
{
    /// <summary>An active account needs at least one way to sign in: a password or a linked Google account.</summary>
    public bool IsActive => Status == AccountStatus.Active && (PasswordHash is not null || GoogleSubject is not null);

    /// <summary>
    /// Value whose change must end existing sessions: the password hash, or the Google link for
    /// accounts without a password.
    /// </summary>
    public string CredentialStamp => AuthService.PasswordStamp(PasswordHash ?? "google:" + GoogleSubject);
}

public static class AccountStatus
{
    public const string Active = "active";
    /// <summary>Registered but the email address is not confirmed yet; cannot sign in.</summary>
    public const string Pending = "pending";
}

/// <summary>Machine-readable "code" in problem JSON for errors the frontend reacts to specifically.</summary>
public static class AuthErrorCodes
{
    public const string EmailNotVerified = "email_not_verified";
    /// <summary>The account has no contact phone yet; bookings need one so staff can reach the customer.</summary>
    public const string PhoneRequired = "phone_required";
}

/// <summary>Three roles: customers act on their own orders (self); staff and admins see everything (global).</summary>
public static class RoleCodes
{
    public const string Customer = "CUSTOMER";
    public const string Staff = "STAFF";
    public const string Admin = "ADMIN";

    public static readonly IReadOnlySet<string> Operators = new HashSet<string> { Staff, Admin };
}

public static class RoleScopes
{
    public const string Global = "global";
    public const string Region = "region";
    public const string Branch = "branch";
    public const string Self = "self";
}

public static class AuthOptions
{
    public const string SessionCookie = "SaiHanh.Session";
    public const string CsrfCookie = "SaiHanh.Csrf";
    public const string CsrfHeader = "X-CSRF-Token";
    public const string PasswordStampClaim = "password_stamp";
    public const string RateLimitPolicy = "auth";
    public const int PasswordHashIterations = 210_000;
    public static readonly TimeSpan SessionLifetime = TimeSpan.FromHours(8);
}
