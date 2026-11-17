using TravelHub.Api.Common.Errors;

namespace TravelHub.Api.Features.Auth;

/// <summary>The account validated against MySQL for this request by <see cref="SessionValidator"/>.</summary>
public static class CurrentUser
{
    public static Account? FindAccount(this HttpContext context) => context.Items[typeof(Account)] as Account;

    public static Account GetRequiredAccount(this HttpContext context) => context.FindAccount()
        ?? throw ApiException.Unauthorized("Vui lòng đăng nhập để tiếp tục.");

    public static ulong GetRequiredUserId(this HttpContext context) =>
        ulong.Parse(context.GetRequiredAccount().User.Id, System.Globalization.CultureInfo.InvariantCulture);

    /// <summary>
    /// Id of the signed-in customer, provided the account has a saved contact phone. Enforced on the server
    /// so no booking is ever created without a way to reach the customer.
    /// </summary>
    public static ulong GetRequiredContactUserId(this HttpContext context)
    {
        var account = context.GetRequiredAccount();
        if (string.IsNullOrWhiteSpace(account.User.Phone))
            throw ApiException.BadRequest("Vui lòng lưu số điện thoại liên hệ trước khi đặt chỗ.",
                AuthErrorCodes.PhoneRequired);
        return context.GetRequiredUserId();
    }
}
