using System.Text.Json;

namespace TravelHub.Api.Features.ServiceRequests;

// ---- Public form --------------------------------------------------------------------------------

/// <param name="Website">Honeypot: hidden from people, so any value means a bot. Never stored.</param>
/// <param name="Details">Service-specific fields; read into the typed input of <paramref name="ServiceType"/>.</param>
public sealed record CreateServiceRequestRequest(
    string? ServiceType,
    string? FullName,
    string? Phone,
    string? Email,
    string? Note,
    bool Consent,
    string? Website,
    JsonElement? Details);

public sealed record ServiceRequestCreatedDto(string Code, string ServiceType, DateTime CreatedAt);

// Typed inputs, nullable so a missing field becomes a field error instead of a parse failure.
public sealed record AttractionTicketsInput(string? Destination, DateOnly? VisitDate, int? Adults, int? Children);

public sealed record CarRentalInput(int? VehicleSeats, int? Passengers, DateOnly? DepartDate, DateOnly? ReturnDate,
    string? PickupPlace, string? DropoffPlace, string? AirportTransfer);

public sealed record VisaInput(string? Country, string? VisaType, DateOnly? TravelDate, int? Applicants);

public sealed record GroupTourInput(string? CompanyName, int? GroupSize, DateOnly? StartDate, DateOnly? EndDate,
    string? Budget, string? ProgramType);

// Validated details exactly as stored in service_requests.details.
public sealed record AttractionTicketsDetails(string Destination, DateOnly VisitDate, int Adults, int Children);

public sealed record CarRentalDetails(int VehicleSeats, int Passengers, DateOnly DepartDate, DateOnly ReturnDate,
    string PickupPlace, string DropoffPlace, string AirportTransfer);

public sealed record VisaDetails(string Country, string VisaType, DateOnly TravelDate, int Applicants);

public sealed record GroupTourDetails(string CompanyName, int GroupSize, DateOnly StartDate, DateOnly EndDate,
    string Budget, string ProgramType);

/// <param name="DetailsJson">Serialized typed details (camelCase), ready for the JSON column.</param>
public sealed record ValidServiceRequest(string ServiceType, string FullName, string Phone, string? Email,
    string? Note, string DetailsJson);

// ---- Back office ----------------------------------------------------------------------------------

public sealed record ServiceRequestFilter(string? Query, string? ServiceType, string? Status);

public sealed record ServiceRequestSummaryDto(
    string Id,
    string Code,
    string ServiceType,
    string FullName,
    string Phone,
    string? Email,
    string Status,
    string? AssignedUserId,
    string? AssignedToName,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record ServiceRequestNoteDto(string Id, string AuthorName, string Note, DateTime CreatedAt);

public sealed record ServiceRequestDetailDto(
    ServiceRequestSummaryDto Summary,
    string? CustomerNote,
    JsonElement Details,
    DateTime ConsentAt,
    IReadOnlyList<ServiceRequestNoteDto> Notes);

public sealed record ServiceRequestCountDto(int Count);

public sealed record UpdateServiceRequestStatusRequest(string? Status);

public sealed record AddServiceRequestNoteRequest(string? Note);
