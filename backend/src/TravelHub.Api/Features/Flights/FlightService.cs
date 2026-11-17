using System.Globalization;
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

    public async Task<FlightPriceCalendarDto> GetPriceCalendarAsync(FlightPriceCalendarQuery query,
        CancellationToken ct)
    {
        var errors = new ValidationErrors();
        var route = ValidateRoute(query.From, query.To, query.Cabin, errors);
        var validMonth = FlightPriceCalendar.TryParseMonth(query.Month, out var first);
        errors.AddIf(!validMonth, "month", "Tháng phải có dạng yyyy-MM.");
        errors.AddIf(validMonth && !FlightPriceCalendar.IsWithinBookingWindow(first, clock.Today), "month",
            $"Chỉ xem được từ tháng này đến {FlightPriceCalendar.MaxMonthsAhead} tháng tới.");
        errors.ThrowIfAny();

        var last = first.AddMonths(1).AddDays(-1);
        var rows = await LowestPricesAsync(route, first, last, ct);
        var days = FlightPriceCalendar.BuildDays(first, last, rows);
        decimal? cheapest = rows.Count == 0 ? null : rows.Min(row => row.LowestPrice);
        var month = first.ToString(FlightPriceCalendar.MonthFormat, CultureInfo.InvariantCulture);
        return new FlightPriceCalendarDto(route.From, route.To, route.Cabin, month, cheapest, days);
    }

    public async Task<FlexibleFaresDto> GetFlexibleFaresAsync(FlexibleFaresQuery query, CancellationToken ct)
    {
        var errors = new ValidationErrors();
        var route = ValidateRoute(query.From, query.To, query.Cabin, errors);
        ValidateTravelDates(query.Date, query.ReturnDate, errors);
        errors.ThrowIfAny();

        var date = query.Date!.Value;
        var (first, last) = FlexibleFares.Window(date, clock.Today);
        var outbound = FlightPriceCalendar.BuildDays(first, last, await LowestPricesAsync(route, first, last, ct));
        if (query.ReturnDate is not { } returnDate)
        {
            var lowest = outbound.Min(day => day.LowestPrice);
            return new FlexibleFaresDto(route.From, route.To, route.Cabin, date, null, outbound, [], [], lowest);
        }

        var back = new FlightRoute(route.To, route.From, route.Cabin);
        var (returnFirst, returnLast) = FlexibleFares.Window(returnDate, first);
        var inbound = FlightPriceCalendar.BuildDays(returnFirst, returnLast,
            await LowestPricesAsync(back, returnFirst, returnLast, ct));
        var pairs = FlexibleFares.Combine(outbound, inbound);
        return new FlexibleFaresDto(route.From, route.To, route.Cabin, date, returnDate, outbound, inbound, pairs,
            pairs.Min(pair => pair.Total));
    }

    /// <summary>Departure today or later and inside the booking window; a return, if any, not before it.</summary>
    private void ValidateTravelDates(DateOnly? date, DateOnly? returnDate, ValidationErrors errors)
    {
        var today = clock.Today;
        var lastBookable = new DateOnly(today.Year, today.Month, 1).AddMonths(FlightPriceCalendar.MaxMonthsAhead + 1)
            .AddDays(-1);
        errors.AddIf(date is null, "date", "Chọn ngày bay.");
        errors.AddIf(date < today || date > lastBookable, "date", "Ngày bay nằm ngoài khoảng có báo giá.");
        errors.AddIf(returnDate is not null && date is not null && returnDate < date, "returnDate",
            "Ngày về không được trước ngày đi.");
        errors.AddIf(returnDate > lastBookable, "returnDate", "Ngày về nằm ngoài khoảng có báo giá.");
    }

    /// <summary>Headline economy quote per route departing from today through FlightDeals.WindowDays ahead.</summary>
    public Task<IReadOnlyList<FlightDealDto>> ListDealsAsync(string? from, CancellationToken ct)
    {
        var origin = NormalizeAirport(from);
        var errors = new ValidationErrors();
        errors.AddIf(!string.IsNullOrEmpty(origin) && !AirportCode().IsMatch(origin), "from", InvalidOrigin);
        errors.ThrowIfAny();
        var windowEnd = VietnamClock.StartOfDayUtc(clock.Today.AddDays(FlightDeals.WindowDays));
        return repository.ListDealsAsync(string.IsNullOrEmpty(origin) ? null : origin, clock.UtcNow, windowEnd, ct);
    }

    /// <summary>Lowest quote per Vietnamese day from first to last inclusive.</summary>
    private Task<IReadOnlyList<FlightDayLowest>> LowestPricesAsync(FlightRoute route, DateOnly first,
        DateOnly last, CancellationToken ct) =>
        repository.LowestPricesByDayAsync(route, VietnamClock.StartOfDayUtc(first),
            VietnamClock.StartOfDayUtc(last.AddDays(1)), clock.UtcNow, ct);

    private static FlightSearchQuery Validate(FlightSearchQuery query)
    {
        var errors = new ValidationErrors();
        var from = NormalizeAirport(query.From);
        var to = NormalizeAirport(query.To);
        var cabin = query.Cabin?.Trim().ToLowerInvariant();
        errors.AddIf(!string.IsNullOrEmpty(from) && !AirportCode().IsMatch(from), "from", InvalidOrigin);
        errors.AddIf(!string.IsNullOrEmpty(to) && !AirportCode().IsMatch(to), "to", InvalidDestination);
        errors.AddIf(!string.IsNullOrEmpty(from) && from == to, "to", SameAirports);
        errors.AddIf(!string.IsNullOrEmpty(cabin) && !CabinClass.All.Contains(cabin), "cabin", InvalidCabin);
        errors.ThrowIfAny();
        return new FlightSearchQuery(from, to, query.Date, cabin);
    }

    /// <summary>Calendar, flexible dates and alerts need both airports; the cabin defaults to economy.</summary>
    internal static FlightRoute ValidateRoute(string? rawFrom, string? rawTo, string? rawCabin,
        ValidationErrors errors)
    {
        var from = NormalizeAirport(rawFrom) ?? "";
        var to = NormalizeAirport(rawTo) ?? "";
        var cabin = string.IsNullOrWhiteSpace(rawCabin) ? CabinClass.Economy : rawCabin.Trim().ToLowerInvariant();
        errors.AddIf(!AirportCode().IsMatch(from), "from", InvalidOrigin);
        errors.AddIf(!AirportCode().IsMatch(to), "to", InvalidDestination);
        errors.AddIf(from.Length > 0 && from == to, "to", SameAirports);
        errors.AddIf(!CabinClass.All.Contains(cabin), "cabin", InvalidCabin);
        return new FlightRoute(from, to, cabin);
    }

    private static string? NormalizeAirport(string? raw) => raw?.Trim().ToUpperInvariant();

    private const string InvalidOrigin = "Mã sân bay đi không hợp lệ.";
    private const string InvalidDestination = "Mã sân bay đến không hợp lệ.";
    private const string SameAirports = "Điểm đi và điểm đến phải khác nhau.";
    private const string InvalidCabin = "Hạng vé không hợp lệ.";

    [GeneratedRegex("^[A-Z]{3}$")]
    private static partial Regex AirportCode();
}
