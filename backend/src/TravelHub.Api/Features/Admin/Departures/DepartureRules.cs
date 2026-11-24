using TravelHub.Api.Common.Errors;
using TravelHub.Api.Common.Http;

namespace TravelHub.Api.Features.Admin.Departures;

/// <summary>Pure rules of the departure screens (dates, prices, seats), unit-tested without a database.</summary>
public static class DepartureRules
{
    public const int MaxBulkDates = 100;
    public const int MaxBulkSpanDays = 366;
    public const int MaxCapacity = 500;
    public const decimal MaxPrice = 1_000_000_000m;

    /// <summary>A tour of N days returns on day N: a 3-day tour leaving on the 1st returns on the 3rd.</summary>
    public static DateOnly ReturnDate(DateOnly departure, int durationDays) =>
        departure.AddDays(Math.Max(1, durationDays) - 1);

    public static ValidDepartureTerms Terms(DepartureTermsInput input, ValidationErrors errors)
    {
        var location = Id(input.DepartureLocationId, "departureLocationId", "Vui lòng chọn điểm khởi hành.", errors);
        var branch = Id(input.OperatingBranchId, "operatingBranchId", "Vui lòng chọn chi nhánh điều hành.", errors);
        var capacity = input.Capacity ?? 0;
        var minGuests = input.MinGuests ?? 1;
        errors.AddIf(capacity is < 1 or > MaxCapacity, "capacity", $"Số chỗ từ 1 đến {MaxCapacity}.");
        errors.AddIf(minGuests < 1 || minGuests > Math.Max(capacity, 1), "minGuests",
            "Số khách tối thiểu từ 1 đến số chỗ.");
        AddPrice(input.AdultPrice, required: true, "adultPrice", errors);
        AddPrice(input.ChildPrice, required: false, "childPrice", errors);
        errors.AddIf(input.ChildPrice > input.AdultPrice, "childPrice", "Giá trẻ em không cao hơn giá người lớn.");
        return new ValidDepartureTerms(location, branch, capacity, minGuests, input.AdultPrice ?? 0, input.ChildPrice);
    }

    /// <summary>Sales open only for a future day, as on the booking side (departure_date &gt; today).</summary>
    public static void AddFutureDate(DateOnly? date, DateOnly today, string field, ValidationErrors errors) =>
        errors.AddIf(date is null || date <= today, field, "Ngày khởi hành phải sau hôm nay.");

    /// <summary>Every matching weekday in [from, to], at most <see cref="MaxBulkDates"/> of them.</summary>
    public static IReadOnlyList<DateOnly> WeeklyDates(BulkDeparturesRequest request, DateOnly today,
        ValidationErrors errors)
    {
        AddFutureDate(request.FromDate, today, "fromDate", errors);
        var weekdays = (request.Weekdays ?? []).Distinct().ToHashSet();
        errors.AddIf(weekdays.Count == 0 || weekdays.Any(day => day is < 0 or > 6), "weekdays",
            "Chọn ít nhất một thứ trong tuần.");
        if (request.FromDate is not { } from || request.ToDate is not { } to)
        {
            errors.AddIf(request.ToDate is null, "toDate", "Vui lòng chọn ngày kết thúc.");
            return [];
        }
        errors.AddIf(to < from, "toDate", "Ngày kết thúc phải từ ngày bắt đầu trở đi.");
        errors.AddIf(to.DayNumber - from.DayNumber > MaxBulkSpanDays, "toDate", "Khoảng tạo tối đa 1 năm.");
        if (to < from || to.DayNumber - from.DayNumber > MaxBulkSpanDays) return [];
        var dates = Enumerable.Range(0, to.DayNumber - from.DayNumber + 1).Select(from.AddDays)
            .Where(date => weekdays.Contains((int)date.DayOfWeek)).ToList();
        errors.AddIf(weekdays.Count > 0 && dates.Count == 0, "weekdays", "Không có ngày nào khớp các thứ đã chọn.");
        errors.AddIf(dates.Count > MaxBulkDates, "toDate", $"Mỗi lần tạo tối đa {MaxBulkDates} lịch.");
        return dates;
    }

    /// <summary>
    /// Early, friendly refusal when the new capacity is below the seats already sold. The UPDATE re-checks
    /// <c>reserved_seats &lt;= @capacity</c> in SQL, which stays the real guard when two people act at once.
    /// </summary>
    public static void EnsureCapacityCoversReserved(int capacity, int reservedSeats)
    {
        if (capacity < reservedSeats)
            throw ApiException.Conflict($"Đã có {reservedSeats} chỗ được đặt, số chỗ không thể thấp hơn.");
    }

    public const int MinReasonLength = 5;
    public const int MaxReasonLength = 500;

    public static readonly IReadOnlyDictionary<string, string> StatusLabels = new Dictionary<string, string>
    {
        [DepartureStatus.Open] = "Mở bán", [DepartureStatus.Closed] = "Tạm đóng bán",
        [DepartureStatus.Guaranteed] = "Chốt đoàn", [DepartureStatus.InProgress] = "Đang đi",
        [DepartureStatus.Completed] = "Hoàn thành", [DepartureStatus.Cancelled] = "Đã hủy",
    };

    /// <summary>
    /// Checks a status change against the life cycle and the calendar. Returns the trimmed cancel reason when the
    /// new status is cancelled (required there), otherwise null.
    /// </summary>
    public static string? CheckTransition(string from, string? to, DateOnly departure, DateOnly returnDate,
        DateOnly today, string? reason)
    {
        if (to is null || !DepartureStatus.All.Contains(to)) throw Invalid("status", "Trạng thái không hợp lệ.");
        if (!DepartureStatus.Next.TryGetValue(from, out var next) || !next.Contains(to))
            throw ApiException.Conflict($"Không chuyển được từ \"{Label(from)}\" sang \"{Label(to)}\".");
        if (to == DepartureStatus.Open && departure <= today)
            throw ApiException.Conflict("Không mở bán lịch đã khởi hành.");
        if (to == DepartureStatus.InProgress && today < departure)
            throw ApiException.Conflict("Chưa tới ngày khởi hành, chưa chuyển sang đang đi được.");
        if (to == DepartureStatus.Completed && today < returnDate)
            throw ApiException.Conflict("Chuyến chưa tới ngày về, chưa hoàn thành được.");
        if (to != DepartureStatus.Cancelled) return null;
        var text = reason?.Trim() ?? "";
        if (text.Length is < MinReasonLength or > MaxReasonLength)
            throw Invalid("reason", $"Lý do hủy từ {MinReasonLength} đến {MaxReasonLength} ký tự.");
        return text;
    }

    public static string Label(string status) => StatusLabels.GetValueOrDefault(status, status);

    private static ApiValidationException Invalid(string field, string message) =>
        new(new Dictionary<string, string[]> { [field] = [message] });

    private static void AddPrice(decimal? price, bool required, string field, ValidationErrors errors) =>
        errors.AddIf((required && price is null) || price is < 0 or > MaxPrice, field, "Giá không hợp lệ.");

    private static ulong Id(string? raw, string field, string message, ValidationErrors errors)
    {
        if (ResourceId.TryParse(raw, out var id)) return id;
        errors.Add(field, message);
        return 0;
    }
}
