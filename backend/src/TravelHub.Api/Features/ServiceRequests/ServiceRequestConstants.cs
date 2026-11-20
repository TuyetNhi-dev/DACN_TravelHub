namespace TravelHub.Api.Features.ServiceRequests;

/// <summary>service_requests.service_type values (migration 012).</summary>
public static class ServiceRequestType
{
    public const string AttractionTickets = "attraction_tickets";
    public const string CarRental = "car_rental";
    public const string Visa = "visa";
    public const string GroupTour = "group_tour";

    public static readonly IReadOnlySet<string> All =
        new HashSet<string> { AttractionTickets, CarRental, Visa, GroupTour };
}

/// <summary>service_requests.status values. Staff may move a request between any of them (reopen included).</summary>
public static class ServiceRequestStatus
{
    public const string New = "new";
    public const string Contacted = "contacted";
    public const string Closed = "closed";

    public static readonly IReadOnlySet<string> All = new HashSet<string> { New, Contacted, Closed };
}

/// <summary>Allowed codes for the choice fields of each service; the frontend maps them to Vietnamese labels.</summary>
public static class ServiceRequestChoices
{
    /// <summary>Seats including the driver.</summary>
    public static readonly IReadOnlySet<int> VehicleSeats = new HashSet<int> { 4, 7, 16, 29, 45 };

    public static readonly IReadOnlySet<string> AirportTransfer =
        new HashSet<string> { "none", "pickup", "dropoff", "both" };

    public static readonly IReadOnlySet<string> VisaTypes = new HashSet<string> { "tourist", "business", "family" };

    /// <summary>Per-person budget bands in VND.</summary>
    public static readonly IReadOnlySet<string> GroupBudgets =
        new HashSet<string> { "under_3m", "3m_5m", "5m_10m", "over_10m" };

    public static readonly IReadOnlySet<string> GroupPrograms =
        new HashSet<string> { "team_building", "conference", "incentive", "custom" };
}

public static class ServiceRequestLimits
{
    public const string CodePrefix = "YC";
    public const int MinNameLength = 2;
    public const int MaxNameLength = 120;
    public const int MaxEmailLength = 254;
    public const int MaxCustomerNoteLength = 1000;
    public const int MaxInternalNoteLength = 2000;
    public const int MinPlaceLength = 2;
    public const int MaxPlaceLength = 160;
    public const int MaxTravelers = 50;
    public const int MinGroupSize = 10;
    public const int MaxGroupSize = 2000;
    public const int MaxCarRentalDays = 60;
    public const int MaxGroupTourDays = 30;
    /// <summary>Requests further ahead than this are almost certainly typos.</summary>
    public const int MaxDaysAhead = 730;
    public const int MaxSearchLength = 100;
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;
}
