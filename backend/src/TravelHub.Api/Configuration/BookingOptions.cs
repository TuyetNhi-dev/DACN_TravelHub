namespace TravelHub.Api.Configuration;

/// <summary>Configuration section "Booking". Defaults apply when the section is absent.</summary>
public sealed class BookingOptions
{
    public const string SectionName = "Booking";
    public const int DefaultTourHoldMinutes = 10;
    public const int DefaultDealHoldMinutes = 10;
    public const int DefaultHoldSweepSeconds = 30;

    /// <summary>How long tour seats stay held before an unpaid order is cancelled. Computed on the server.</summary>
    public int TourHoldMinutes { get; set; } = DefaultTourHoldMinutes;

    /// <summary>How long flight-deal allotment seats stay held before an unpaid order is cancelled.</summary>
    public int DealHoldMinutes { get; set; } = DefaultDealHoldMinutes;

    /// <summary>How often the background job looks for expired holds.</summary>
    public int HoldSweepSeconds { get; set; } = DefaultHoldSweepSeconds;

    public TimeSpan TourHold => TimeSpan.FromMinutes(TourHoldMinutes > 0 ? TourHoldMinutes : DefaultTourHoldMinutes);

    public TimeSpan DealHold =>
        TimeSpan.FromMinutes(DealHoldMinutes > 0 ? DealHoldMinutes : DefaultDealHoldMinutes);

    public TimeSpan HoldSweep =>
        TimeSpan.FromSeconds(HoldSweepSeconds > 0 ? HoldSweepSeconds : DefaultHoldSweepSeconds);
}
