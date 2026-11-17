namespace TravelHub.Api.Features.Bookings;

public static class ServiceType
{
    public const string Tour = "tour";
    public const string Hotel = "hotel";
    public const string Flight = "flight";

    public static readonly IReadOnlySet<string> All = new HashSet<string> { Tour, Hotel, Flight };
}

/// <summary>Order-level status (bookings.status).</summary>
public static class BookingStatus
{
    public const string Pending = "pending";
    public const string Confirmed = "confirmed";
    public const string Cancelled = "cancelled";
    public const string Completed = "completed";

    /// <summary>Every order holds one service, so the order status mirrors its single item.</summary>
    public static string FromItemStatus(string itemStatus) => itemStatus switch
    {
        BookingItemStatus.Confirmed => Confirmed,
        BookingItemStatus.Completed => Completed,
        BookingItemStatus.Cancelled or BookingItemStatus.Failed => Cancelled,
        _ => Pending,
    };
}

/// <summary>Service-level status (booking_items.status).</summary>
public static class BookingItemStatus
{
    /// <summary>Tour seats are held; staff still has to confirm with the customer.</summary>
    public const string Pending = "pending";
    /// <summary>Hotel/flight quote sent to the partner; nothing is guaranteed until they confirm.</summary>
    public const string AwaitingSupplier = "awaiting_supplier";
    public const string Confirmed = "confirmed";
    public const string Cancelled = "cancelled";
    public const string Completed = "completed";
    /// <summary>The partner declined (no room/seat at the quoted price).</summary>
    public const string Failed = "failed";

    public static readonly IReadOnlySet<string> All =
        new HashSet<string> { Pending, AwaitingSupplier, Confirmed, Cancelled, Completed, Failed };

    public static readonly IReadOnlySet<string> Open = new HashSet<string> { Pending, AwaitingSupplier };

    public static string InitialFor(string serviceType) =>
        serviceType == ServiceType.Tour ? Pending : AwaitingSupplier;
}

public static class PassengerType
{
    public const string Adult = "adult";
    public const string Child = "child";
}

public static class BookingLimits
{
    public const int MaxTourTravelers = 20;
    public const int MaxFlightPassengers = 9;
    public const int MaxNights = 30;
    public const int MaxRooms = 10;
    public const int MinNameLength = 2;
    public const int MaxNameLength = 160;
    public const int MaxConfirmationCodeLength = 120;
    public const int MaxStaffListSize = 200;
}
