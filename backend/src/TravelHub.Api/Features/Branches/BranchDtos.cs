namespace TravelHub.Api.Features.Branches;

/// <summary>A public office. Latitude/Longitude are null when the branch has no map location yet.</summary>
public sealed record BranchDto(
    string Id,
    string Code,
    string Name,
    string? Address,
    string? Region,
    decimal? Latitude,
    decimal? Longitude,
    string? Phone,
    string? OpeningHours);
