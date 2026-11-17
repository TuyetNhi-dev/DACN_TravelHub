using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using MySqlConnector;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Auth.EmailVerification;

namespace TravelHub.Api.Features.Auth;

public sealed class AuthService(AuthRepository repository, IPasswordHasher<string> hasher,
    DummyPasswordHash dummyHash, EmailVerificationService verification)
{
    private const int DuplicateKeyError = 1062;
    private const int MaxEmailLength = 254;
    private const int MinPasswordLength = 12;
    private const int MaxPasswordLength = 128;

    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        ValidateRegistration(request);
        var email = NormalizeEmail(request.Email!);
        var fullName = request.FullName!.Trim();
        ulong userId;
        try
        {
            userId = await repository.CreateCustomerAsync(new NewCustomer(fullName, email, null,
                hasher.HashPassword(email, request.Password!), null, AccountStatus.Pending), ct);
        }
        catch (MySqlException ex) when (ex.Number == DuplicateKeyError)
        {
            throw ApiException.Conflict("Email đã được sử dụng.");
        }
        // The account already exists, so a mail failure is reported, not thrown: the user can resend later.
        var sent = await verification.IssueAsync(userId, email, fullName, ct);
        return new RegisterResponse(sent
            ? "Mã xác nhận gồm 6 chữ số đã được gửi tới email của bạn."
            : "Đã tạo tài khoản nhưng chưa gửi được mã xác nhận. Vui lòng bấm gửi lại sau ít phút.", sent);
    }

    /// <summary>
    /// Same error for unknown email and wrong password so accounts cannot be enumerated. Only a caller who
    /// knows the correct password learns that the email is still unverified.
    /// </summary>
    public async Task<Account> VerifyLoginAsync(LoginRequest request, CancellationToken ct)
    {
        if (!IsValidEmail(request.Email) || string.IsNullOrEmpty(request.Password)
            || request.Password.Length > MaxPasswordLength)
            throw ApiException.BadRequest("Vui lòng nhập email và mật khẩu hợp lệ.");
        var account = await repository.FindByEmailAsync(NormalizeEmail(request.Email!), ct);
        // The dummy hash makes unknown accounts pay the same verification cost as real ones.
        var verified = Verify(request.Email!, account?.PasswordHash ?? dummyHash.Value, request.Password);
        if (account is not null && verified && account.Status == AccountStatus.Pending)
            throw ApiException.Forbidden(
                "Email chưa được xác nhận. Hãy nhập mã 6 số đã gửi tới email hoặc gửi lại mã.",
                AuthErrorCodes.EmailNotVerified);
        if (account is null || !account.IsActive || !verified)
            throw ApiException.Unauthorized("Email hoặc mật khẩu không đúng, hoặc tài khoản chưa hoạt động.");
        return account;
    }

    /// <summary>Stores the signed-in customer's contact phone and returns the refreshed profile.</summary>
    public async Task<AuthUserDto> UpdatePhoneAsync(ulong userId, UpdatePhoneRequest request, CancellationToken ct)
    {
        if (!PhoneNumber.IsValid(request.Phone))
            throw new ApiValidationException(new Dictionary<string, string[]>
            {
                ["phone"] = [PhoneNumber.InvalidMessage],
            });
        await repository.UpdatePhoneAsync(userId, request.Phone!.Trim(), ct);
        return (await repository.FindByIdAsync(userId, ct))!.User;
    }

    public static string PasswordStamp(string hash) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hash)));

    private bool Verify(string email, string hash, string password)
    {
        try
        {
            return hasher.VerifyHashedPassword(email, hash, password) != PasswordVerificationResult.Failed;
        }
        catch (FormatException)
        {
            return false; // A malformed stored hash is treated as a failed login, never as success.
        }
    }

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    public static bool IsValidEmail(string? value) => !string.IsNullOrWhiteSpace(value)
        && value.Trim().Length <= MaxEmailLength && new EmailAddressAttribute().IsValid(value.Trim());

    private static void ValidateRegistration(RegisterRequest request)
    {
        var errors = new ValidationErrors();
        errors.AddIf(string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length is < 2 or > 160,
            "fullName", "Họ tên cần từ 2 đến 160 ký tự.");
        errors.AddIf(!IsValidEmail(request.Email), "email", "Email không hợp lệ.");
        errors.AddIf(request.Password is null || request.Password.Length is < MinPasswordLength or > MaxPasswordLength,
            "password", "Mật khẩu cần từ 12 đến 128 ký tự.");
        errors.AddIf(request.Password != request.ConfirmPassword, "confirmPassword", "Mật khẩu xác nhận không khớp.");
        errors.AddIf(!request.AcceptTerms, "acceptTerms",
            "Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
        errors.ThrowIfAny();
    }
}

public sealed class DummyPasswordHash(IPasswordHasher<string> hasher)
{
    public string Value { get; } = hasher.HashPassword("", Convert.ToHexString(RandomNumberGenerator.GetBytes(32)));
}
