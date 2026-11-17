namespace TravelHub.Api.Features.Hotels;

/// <summary>Hotels are partner quotes, not SàiHành inventory: prices are references, never availability.</summary>
public sealed record HotelSummaryDto(
    string Id,
    string Name,
    string City,
    string? Address,
    int? StarRating,
    string? Description,
    decimal? ReferencePricePerNight);

public sealed record RoomTypeDto(
    string Id,
    string Name,
    int MaxGuests,
    string? Description,
    decimal? ReferencePricePerNight,
    string? OfferTerms);

/// <summary>Category and Code are stable identifiers; Name is the Vietnamese label. IsPaid = extra charge.</summary>
public sealed record HotelAmenityDto(string Code, string Name, string Category, bool IsHighlight, bool IsPaid);

/// <summary>Type is a stable code (children, pets, payment, ...); Content is shown as written by the partner.</summary>
public sealed record HotelPolicyDto(string Type, string Content);

/// <summary>Check-in/out are Vietnam wall-clock times as "HH:mm", null when the partner has not said.</summary>
public sealed record HotelHouseRulesDto(
    string? CheckInFrom,
    string? CheckOutUntil,
    IReadOnlyList<HotelPolicyDto> Policies);

public sealed record HotelDetailDto(
    HotelSummaryDto Hotel,
    IReadOnlyList<RoomTypeDto> RoomTypes,
    IReadOnlyList<HotelAmenityDto> Amenities,
    HotelHouseRulesDto HouseRules);
