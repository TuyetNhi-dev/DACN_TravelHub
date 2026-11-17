using System.Text.RegularExpressions;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Time;

namespace TravelHub.Api.Features.Flights;

public sealed partial class FlightService(FlightRepository repository, VietnamClock clock)
{
    public Task<IReadOnlyList<FlightOfferDto>> SearchAsync(FlightSearchQuery query, CancellationToken ct)
    {
        var normalized = Validate(query);
        DateTime? dayStart = normalized.Date is { } date ? VietnamClock.StartOfDayUtc(date) : null;
        return repository.SearchAsync(normalized, clock.UtcNow, dayStart, ct);
    }

    private static FlightSearchQuery Validate(FlightSearchQuery query)
    {
        var errors = new ValidationErrors();
        var from = query.From?.Trim().ToUpperInvariant();
        var to = query.To?.Trim().ToUpperInvariant();
        var cabin = query.Cabin?.Trim().ToLowerInvariant();
        errors.AddIf(!string.IsNullOrEmpty(from) && !AirportCode().IsMatch(from), "from", "Mã sân bay đi không hợp lệ.");
        errors.AddIf(!string.IsNullOrEmpty(to) && !AirportCode().IsMatch(to), "to", "Mã sân bay đến không hợp lệ.");
        errors.AddIf(!string.IsNullOrEmpty(from) && from == to, "to", "Điểm đi và điểm đến phải khác nhau.");
        errors.AddIf(!string.IsNullOrEmpty(cabin) && !CabinClass.All.Contains(cabin), "cabin", "Hạng vé không hợp lệ.");
        errors.ThrowIfAny();
        return new FlightSearchQuery(from, to, query.Date, cabin);
    }

    [GeneratedRegex("^[A-Z]{3}$")]
    private static partial Regex AirportCode();
}
