using ClosedXML.Excel;
using TravelHub.Api.Common.Errors;
using TravelHub.Api.Features.Admin.Access;
using TravelHub.Api.Features.Admin.Audit;
using TravelHub.Api.Features.Admin.Bookings;
using TravelHub.Api.Features.Admin.Dashboard;
using TravelHub.Api.Features.Admin.Departures;
using TravelHub.Api.Features.Admin.Staff;
using TravelHub.Api.Features.Admin.Tours;
using TravelHub.Api.Features.Auth;
using TravelHub.Api.Features.Tours;
using DepartureStatus = TravelHub.Api.Features.Admin.Departures.DepartureStatus;

namespace TravelHub.Api.Tests;

public sealed class AdminTourValidatorTests
{
    private static SaveTourRequest Form(string code = "tour-ha-long", int days = 3, int nights = 2) =>
        new(code, "Hạ Long – Vịnh di sản", "5", null, "1", days, nights, 2_500_000m, "  Mô tả  ");

    [Fact]
    public void A_valid_form_is_trimmed_and_the_code_upper_cased()
    {
        var tour = AdminTourValidator.Tour(Form());
        Assert.Equal("TOUR-HA-LONG", tour.Code);
        Assert.Equal("Mô tả", tour.Description);
        Assert.Equal(5UL, tour.DestinationId);
        Assert.Null(tour.CategoryId);
    }

    [Fact]
    public void Every_problem_is_reported_at_once()
    {
        var error = Assert.Throws<ApiValidationException>(() => AdminTourValidator.Tour(
            new SaveTourRequest("x", "abc", null, "nope", null, 0, 1, -1, null)));
        Assert.Equal(["basePrice", "categoryId", "code", "destinationId", "durationDays", "durationNights",
            "operatingBranchId", "title"], error.Errors.Keys.Order());
    }

    [Fact]
    public void Nights_cannot_exceed_days()
    {
        Assert.Throws<ApiValidationException>(() => AdminTourValidator.Tour(Form(days: 2, nights: 3)));
        Assert.Equal(0, AdminTourValidator.Tour(Form(days: 1, nights: 0)).DurationNights);
    }

    [Fact]
    public void Only_curated_unsplash_photos_are_accepted()
    {
        var ok = AdminTourValidator.Images(new SaveTourImagesRequest([
            new("https://images.unsplash.com/photo-1603852452378-a4e8d84324a2?auto=format&w=1920", " Vịnh "),
        ]));
        Assert.Equal("Vịnh", ok[0].AltText);
        var error = Assert.Throws<ApiValidationException>(() => AdminTourValidator.Images(new SaveTourImagesRequest([
            new("https://example.com/photo-1.jpg", null), new("javascript:alert(1)", null),
        ])));
        Assert.Equal(["images[0].url", "images[1].url"], error.Errors.Keys.Order());
    }

    [Fact]
    public void Itinerary_days_are_numbered_by_their_order()
    {
        var days = AdminTourValidator.Itinerary(new SaveItineraryRequest([new(" Ngày đầu ", null), new("Về", "x")]));
        Assert.Equal([1, 2], days.Select(d => d.DayNumber));
        Assert.Equal("Ngày đầu", days[0].Title);
    }

    [Fact]
    public void Inclusions_need_a_known_service_type()
    {
        Assert.Throws<ApiValidationException>(() => AdminTourValidator.Inclusions(new SaveInclusionsRequest([
            new("spa", "Massage", true),
        ])));
        Assert.Single(AdminTourValidator.Inclusions(new SaveInclusionsRequest([new("meal", " Ăn sáng ", true)])));
    }

    [Fact]
    public void Status_only_accepts_the_three_editor_states()
    {
        Assert.Equal("paused", AdminTourValidator.Status("paused"));
        Assert.Throws<ApiValidationException>(() => AdminTourValidator.Status("archived"));
    }

    [Fact]
    public void Clone_codes_get_a_suffix_and_stay_within_forty_characters()
    {
        Assert.Equal("TOUR001-BS", AdminTourValidator.CloneCode("TOUR001", 1));
        Assert.Equal("TOUR001-BS3", AdminTourValidator.CloneCode("TOUR001", 3));
        var longCode = new string('A', 40);
        Assert.Equal(40, AdminTourValidator.CloneCode(longCode, 12).Length);
    }
}

public sealed class DepartureRulesTests
{
    private static readonly DateOnly Today = new(2026, 11, 22); // a Sunday

    private static BulkDeparturesRequest Weekly(DateOnly from, DateOnly to, params int[] weekdays) =>
        new(from, to, weekdays, "3", "1", 30, 10, 3_000_000m, 2_000_000m);

    [Fact]
    public void Weekly_dates_follow_the_chosen_weekdays()
    {
        var errors = new ValidationErrors();
        var dates = DepartureRules.WeeklyDates(Weekly(new(2026, 11, 23), new(2026, 12, 6), 5, 6), Today, errors);
        Assert.False(errors.HasErrors);
        Assert.Equal([new DateOnly(2026, 11, 27), new(2026, 11, 28), new(2026, 12, 4), new(2026, 12, 5)], dates);
    }

    [Fact]
    public void Weekly_creation_refuses_past_starts_empty_weekdays_and_too_many_dates()
    {
        var errors = new ValidationErrors();
        DepartureRules.WeeklyDates(Weekly(Today, new(2026, 12, 1)), Today, errors);
        var thrown = Assert.Throws<ApiValidationException>(errors.ThrowIfAny);
        Assert.Equal(["fromDate", "weekdays"], thrown.Errors.Keys.Order());

        var tooMany = new ValidationErrors();
        DepartureRules.WeeklyDates(Weekly(new(2026, 11, 23), new(2027, 11, 20), 0, 1, 2, 3, 4, 5, 6), Today, tooMany);
        Assert.Contains("toDate", Assert.Throws<ApiValidationException>(tooMany.ThrowIfAny).Errors.Keys);
    }

    [Fact]
    public void Return_date_counts_the_departure_day()
    {
        Assert.Equal(new DateOnly(2026, 12, 3), DepartureRules.ReturnDate(new(2026, 12, 1), 3));
        Assert.Equal(new DateOnly(2026, 12, 1), DepartureRules.ReturnDate(new(2026, 12, 1), 1));
    }

    [Fact]
    public void Terms_check_seats_minimum_and_prices()
    {
        var errors = new ValidationErrors();
        DepartureRules.Terms(new DepartureTermsInput("3", "1", 10, 12, 1_000_000m, 1_500_000m), errors);
        Assert.Equal(["childPrice", "minGuests"],
            Assert.Throws<ApiValidationException>(errors.ThrowIfAny).Errors.Keys.Order());
        var ok = new ValidationErrors();
        var terms = DepartureRules.Terms(new DepartureTermsInput("3", "1", 30, 10, 1_000_000m, null), ok);
        Assert.False(ok.HasErrors);
        Assert.Equal(30, terms.Capacity);
    }

    private static readonly DateOnly Leave = new(2026, 12, 5);
    private static readonly DateOnly Back = new(2026, 12, 7);

    private static string? Move(string from, string to, DateOnly today, string? reason = null) =>
        DepartureRules.CheckTransition(from, to, Leave, Back, today, reason);

    [Fact]
    public void Life_cycle_moves_forward_and_sale_reopens_only_before_departure()
    {
        Assert.Null(Move(DepartureStatus.Open, DepartureStatus.Closed, Today));
        Assert.Null(Move(DepartureStatus.Closed, DepartureStatus.Open, Today));
        Assert.Null(Move(DepartureStatus.Open, DepartureStatus.Guaranteed, Today));
        Assert.Null(Move(DepartureStatus.Guaranteed, DepartureStatus.InProgress, Leave));
        Assert.Null(Move(DepartureStatus.InProgress, DepartureStatus.Completed, Back));
        Assert.Equal(409, Assert.Throws<ApiException>(
            () => Move(DepartureStatus.Closed, DepartureStatus.Open, Leave)).StatusCode);
        Assert.Equal(409, Assert.Throws<ApiException>(
            () => Move(DepartureStatus.Guaranteed, DepartureStatus.Open, Today)).StatusCode);
    }

    [Fact]
    public void Trips_cannot_start_or_finish_early_and_final_states_stay_final()
    {
        Assert.Equal(409, Assert.Throws<ApiException>(
            () => Move(DepartureStatus.Guaranteed, DepartureStatus.InProgress, Today)).StatusCode);
        Assert.Equal(409, Assert.Throws<ApiException>(
            () => Move(DepartureStatus.InProgress, DepartureStatus.Completed, Leave)).StatusCode);
        foreach (var final in new[] { DepartureStatus.Completed, DepartureStatus.Cancelled })
            Assert.Throws<ApiException>(() => Move(final, DepartureStatus.Open, Today, "Lý do bất kỳ"));
        Assert.Throws<ApiValidationException>(() => Move(DepartureStatus.Open, "deleted", Today));
    }

    [Fact]
    public void Cancelling_needs_a_reason_which_is_trimmed()
    {
        var error = Assert.Throws<ApiValidationException>(
            () => Move(DepartureStatus.Open, DepartureStatus.Cancelled, Today, "  ab "));
        Assert.Equal(["reason"], error.Errors.Keys);
        Assert.Equal("Không đủ khách tối thiểu",
            Move(DepartureStatus.Guaranteed, DepartureStatus.Cancelled, Today, "  Không đủ khách tối thiểu "));
        Assert.Throws<ApiException>(
            () => Move(DepartureStatus.InProgress, DepartureStatus.Cancelled, Leave, "Đã khởi hành"));
    }

    [Fact]
    public void Capacity_cannot_drop_below_seats_already_sold()
    {
        DepartureRules.EnsureCapacityCoversReserved(capacity: 12, reservedSeats: 12);
        var error = Assert.Throws<ApiException>(() => DepartureRules.EnsureCapacityCoversReserved(11, 12));
        Assert.Equal(409, error.StatusCode);
        Assert.Contains("12 chỗ", error.Message);
    }

    [Fact]
    public void Bulk_creation_covers_the_range_on_each_chosen_weekday_only()
    {
        var errors = new ValidationErrors();
        // Saturdays (6) and Sundays (0) from Mon 23/11 to Sun 20/12/2026: four weekends.
        var dates = DepartureRules.WeeklyDates(Weekly(new(2026, 11, 23), new(2026, 12, 20), 0, 6), Today, errors);
        Assert.False(errors.HasErrors);
        Assert.Equal(8, dates.Count);
        Assert.All(dates, d => Assert.Contains(d.DayOfWeek, new[] { DayOfWeek.Saturday, DayOfWeek.Sunday }));
        Assert.Equal(new DateOnly(2026, 11, 28), dates[0]);
        Assert.Equal(new DateOnly(2026, 12, 20), dates[^1]);
    }
}

public sealed class AdminAuditAndSystemTests
{
    [Fact]
    public void Audit_diff_keeps_only_changed_fields_and_never_secrets()
    {
        var changes = AuditChanges.Diff(
            new Dictionary<string, object?> { ["title"] = "A", ["basePrice"] = 2_000_000.00m, ["passwordHash"] = "x" },
            new Dictionary<string, object?> { ["title"] = "B", ["basePrice"] = 2_000_000m, ["passwordHash"] = "y" });
        Assert.Equal([new AuditChange("title", "A", "B")], changes);
        Assert.Null(AuditChanges.Diff(new Dictionary<string, object?> { ["a"] = 1 },
            new Dictionary<string, object?> { ["a"] = 1 }));
    }

    [Fact]
    public void Audit_changes_round_trip_through_the_documented_json_shape()
    {
        var json = AuditLogWriter.ToJson([new AuditChange("status", "open", "closed")]);
        Assert.Equal("""{"status":["open","closed"]}""", json);
        Assert.Equal([new AuditChange("status", "open", "closed")], AuditLogRepository.ParseChanges(json));
        Assert.Null(AuditLogWriter.ToJson([]));
    }

    [Fact]
    public void Staff_rules_tie_admin_to_global_and_need_a_target_for_narrow_scopes()
    {
        var error = Assert.Throws<ApiValidationException>(() => StaffRules.Validate(
            new AssignStaffRequest("A@Example.com", RoleCodes.Admin, RoleScopes.Branch, null, null)));
        Assert.Equal(["branchId", "scope"], error.Errors.Keys.Order());
        var ok = StaffRules.Validate(new AssignStaffRequest(" A@Example.com ", RoleCodes.BranchManager,
            RoleScopes.Region, "2", "9"));
        Assert.Equal("a@example.com", ok.Email);
        Assert.Equal(2UL, ok.RegionId);
        Assert.Null(ok.BranchId);
        Assert.Throws<ApiValidationException>(() => StaffRules.Validate(
            new AssignStaffRequest("a@example.com", RoleCodes.Customer, RoleScopes.Self, null, null)));
    }

    [Fact]
    public void Dashboard_month_uses_vietnamese_midnight()
    {
        var (start, end) = DashboardRules.MonthUtc(new DateOnly(2026, 11, 22));
        Assert.Equal(new DateTime(2026, 10, 31, 17, 0, 0, DateTimeKind.Utc), start);
        Assert.Equal(new DateTime(2026, 11, 30, 17, 0, 0, DateTimeKind.Utc), end);
    }

    [Fact]
    public void Region_chart_has_one_bar_per_region_in_scope_and_online_only_for_global()
    {
        IReadOnlyList<BranchRef> branches =
        [
            new(1, "HN", "HN", 1, "NORTH", "Miền Bắc"), new(3, "HCM", "HCM", 3, "SOUTH", "Miền Nam"),
            new(4, "CT", "CT", 3, "SOUTH", "Miền Nam"),
        ];
        var revenue = new Dictionary<string, decimal> { ["SOUTH"] = 5m, ["ONLINE"] = 2m };
        var south = DashboardRules.RegionRows(revenue, branches, new ScopeSet(false, new HashSet<ulong> { 3, 4 }));
        Assert.Equal([new RegionRevenueDto("SOUTH", "Miền Nam", 5m)], south);
        var all = DashboardRules.RegionRows(revenue, branches, ScopeSet.Everything);
        Assert.Equal(["NORTH", "SOUTH", "ONLINE"], all.Select(r => r.Code));
        Assert.Equal(0m, all[0].Revenue);
    }

    [Fact]
    public void Dashboard_compares_with_last_month_and_reports_occupancy()
    {
        Assert.Equal(25.0m, DashboardRules.ChangePercent(125m, 100m));
        Assert.Equal(-50.0m, DashboardRules.ChangePercent(50m, 100m));
        Assert.Null(DashboardRules.ChangePercent(80m, 0m));
        Assert.Equal(33.3m, DashboardRules.OccupancyPercent(new SeatTotals(10, 30)));
        Assert.Null(DashboardRules.OccupancyPercent(new SeatTotals(0, 0)));
        var months = DashboardRules.LastMonths(new DateOnly(2026, 2, 14), 6);
        Assert.Equal(["2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02"],
            months.Select(DashboardRules.MonthKey));
    }

    [Fact]
    public void Tour_sort_keys_map_to_fixed_sql_and_unknown_keys_are_refused()
    {
        Assert.Equal("t.base_price DESC, t.id", AdminTourSort.Sql("price_desc"));
        Assert.Equal("t.id DESC", AdminTourSort.Sql(null));
        Assert.True(AdminTourSort.IsKnown(null));
        Assert.False(AdminTourSort.IsKnown("t.id; DROP TABLE tours"));
    }

    [Fact]
    public void Booking_notes_are_trimmed_and_history_starts_with_the_order()
    {
        Assert.Equal("Gọi lại lúc 9h", BookingNoteRules.Validate(new BookingNoteRequest("  Gọi lại lúc 9h ")));
        Assert.Throws<ApiValidationException>(() => BookingNoteRules.Validate(new BookingNoteRequest("   ")));
        Assert.Throws<ApiValidationException>(() =>
            BookingNoteRules.Validate(new BookingNoteRequest(new string('x', BookingNoteRules.MaxLength + 1))));
        var created = new DateTime(2026, 11, 20, 1, 0, 0, DateTimeKind.Utc);
        var history = BookingNoteRules.History(created, "Khách A", [
            new BookingHistoryDto(created.AddHours(5), "NV", "booking.confirm", "Xác nhận"),
            new BookingHistoryDto(created.AddHours(1), "NV", "booking.reject", "Từ chối"),
        ]);
        Assert.Equal([BookingNoteRules.CreatedAction, "booking.reject", "booking.confirm"],
            history.Select(h => h.Action));
    }

    [Fact]
    public void Admins_never_remove_their_own_role_or_lock_themselves()
    {
        StaffRules.EnsureNotSelf(1, 2, "x");
        Assert.Equal(409, Assert.Throws<ApiException>(() => StaffRules.EnsureNotSelf(7, 7, "x")).StatusCode);
    }

    [Fact]
    public void Public_tour_list_accepts_only_known_region_codes()
    {
        Assert.Null(TourService.ValidRegion(null));
        Assert.Equal("SOUTH", TourService.ValidRegion("SOUTH"));
        Assert.Throws<ApiException>(() => TourService.ValidRegion("south'; DROP"));
    }
}

public sealed class ManifestExcelTests
{
    private static readonly AdminDepartureDto Departure = new("9", "1", "TOUR001", "Đà Nẵng – Hội An", "2",
        "Chi nhánh Đà Nẵng", "3", "Đà Nẵng", new(2026, 12, 5), new(2026, 12, 7), 30, 3, 10, 3_000_000m, null, "open",
        false);

    [Fact]
    public void Workbook_has_a_row_per_passenger_and_a_line_for_orders_without_names()
    {
        var manifest = new ManifestDto(Departure, [
            new("1", "SH261120ABCDEF", "confirmed", "Nguyễn An", "0912345678", "an@example.com", 1, 1, [
                new("Nguyễn An", "adult", new DateOnly(1990, 1, 2)), new("Nguyễn Bé", "child", null),
            ]),
            new("2", "SH261120GHJKLM", "pending", "Trần Bình", null, "binh@example.com", 1, 0, []),
        ], 3);
        using var stream = new MemoryStream(ManifestExcel.Build(manifest));
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheet(ManifestExcel.SheetName);
        Assert.Equal("Họ tên hành khách", sheet.Cell(ManifestExcel.HeaderRow, 3).GetString());
        Assert.Equal("Nguyễn An", sheet.Cell(ManifestExcel.HeaderRow + 1, 3).GetString());
        Assert.Equal("02/01/1990", sheet.Cell(ManifestExcel.HeaderRow + 1, 5).GetString());
        Assert.Equal("Trẻ em", sheet.Cell(ManifestExcel.HeaderRow + 2, 4).GetString());
        Assert.StartsWith("(chưa có tên", sheet.Cell(ManifestExcel.HeaderRow + 3, 3).GetString());
        Assert.Equal("Chưa thanh toán (đang giữ chỗ)", sheet.Cell(ManifestExcel.HeaderRow + 3, 9).GetString());
        Assert.Equal("Đã thanh toán", sheet.Cell(ManifestExcel.HeaderRow + 1, 9).GetString());
        Assert.Equal("SH-TOUR001-2026-12-05.xlsx", ManifestExcel.FileName(Departure));
    }

    [Fact]
    public void Workbook_has_exactly_one_row_per_passenger_a_bold_frozen_header_and_bounded_widths()
    {
        var passengers = Enumerable.Range(1, 7).Select(i => new ManifestPassengerDto($"Khách {i}", "adult", null))
            .ToList();
        var manifest = new ManifestDto(Departure, [
            new("1", "SH1", "confirmed", "Lê Văn Một Người Có Tên Rất Dài Để Thử Độ Rộng Cột Tối Đa", "0900000000",
                "mot-dia-chi-email-rat-dai-de-thu-do-rong-cot@example.com", 7, 0, passengers),
        ], 7);
        using var stream = new MemoryStream(ManifestExcel.Build(manifest));
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheet(ManifestExcel.SheetName);
        Assert.Equal(ManifestExcel.HeaderRow + passengers.Count, sheet.LastRowUsed()!.RowNumber());
        Assert.True(sheet.Cell(ManifestExcel.HeaderRow, 1).Style.Font.Bold);
        Assert.Equal(ManifestExcel.HeaderRow, sheet.SheetView.SplitRow);
        Assert.All(sheet.ColumnsUsed(), column => Assert.True(column.Width <= ManifestExcel.MaxColumnWidth));
    }
}
