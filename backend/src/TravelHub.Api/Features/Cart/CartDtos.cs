namespace TravelHub.Api.Features.Cart;

/// <summary>POST /api/cart/items: add a departure or change its head count.</summary>
public sealed record SaveCartItemRequest(string? DepartureId, int AdultCount, int ChildCount);

/// <summary>
/// One line of a guest cart (browser storage). Prices seen are only used to warn about price changes on the
/// guest's own screen; they are never stored or charged.
/// </summary>
public sealed record GuestCartItem(string? DepartureId, int AdultCount, int ChildCount, decimal? AdultPriceSeen,
    decimal? ChildPriceSeen, DateTimeOffset? UpdatedAt);

public sealed record GuestCartRequest(IReadOnlyList<GuestCartItem>? Items);

/// <summary>A cart line with live prices and seats. <c>Id</c> is null for guest carts (browser only).</summary>
public sealed record CartItemDto(
    string? Id,
    string DepartureId,
    string TourId,
    string TourCode,
    string TourTitle,
    string Destination,
    string? ImageUrl,
    string? ImageAlt,
    string DepartureFrom,
    DateOnly DepartureDate,
    DateOnly ReturnDate,
    int AdultCount,
    int ChildCount,
    decimal AdultPrice,
    decimal ChildPrice,
    decimal AdultPriceSeen,
    decimal? ChildPriceSeen,
    int AvailableSeats,
    string Status,
    decimal Subtotal,
    DateTime UpdatedAt);

public sealed record CartDto(IReadOnlyList<CartItemDto> Items, decimal EstimatedTotal, int MaxItems);

/// <summary>After sign-in: the merged cart and how many guest lines could not be moved into it.</summary>
public sealed record MergeCartResultDto(CartDto Cart, int NotMoved);

/// <summary>Live departure data a cart line is shown with (never a locked price).</summary>
public sealed record CartDepartureRow(
    string DepartureId,
    string TourId,
    string TourCode,
    string TourTitle,
    string TourStatus,
    string Destination,
    string? ImageUrl,
    string? ImageAlt,
    string DepartureFrom,
    DateOnly DepartureDate,
    DateOnly ReturnDate,
    int Capacity,
    int ReservedSeats,
    decimal AdultPrice,
    decimal? ChildPrice,
    string Status);

/// <summary>Raw cart_items row.</summary>
public sealed record CartItemRow(string Id, ulong DepartureId, int AdultCount, int ChildCount, decimal AdultPriceSeen,
    decimal? ChildPriceSeen, DateTime UpdatedAt);

/// <summary>A validated choice: departure id and head count.</summary>
public sealed record CartChoice(ulong DepartureId, int AdultCount, int ChildCount);

/// <summary>
/// One row to write. Prices are the departure's prices read by the server at that moment (never the browser's);
/// UpdatedAt is the guest's own time when merging, otherwise null (= now).
/// </summary>
public sealed record CartSave(CartChoice Choice, decimal AdultPrice, decimal? ChildPrice, DateTime? UpdatedAt);

public static class CartItemStatus
{
    public const string Ok = "ok";
    public const string PriceChanged = "price_changed";
    public const string NotEnoughSeats = "not_enough_seats";
    public const string SoldOut = "sold_out";
    /// <summary>Departure closed, already left, or the tour is no longer published.</summary>
    public const string Unavailable = "unavailable";
}

public static class CartLimits
{
    public const int MaxItems = 10;
    /// <summary>A guest list longer than this is not a real cart; it is refused before any query.</summary>
    public const int MaxGuestItems = 50;
    /// <summary>A guest's "updated at" may be ahead of the server clock by this much before it is clamped.</summary>
    public static readonly TimeSpan ClockSkew = TimeSpan.FromMinutes(5);
}
