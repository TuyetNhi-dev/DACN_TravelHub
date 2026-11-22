using System.Globalization;
using ClosedXML.Excel;

namespace TravelHub.Api.Features.Admin.Departures;

/// <summary>The group list as an .xlsx workbook (ClosedXML, MIT): one row per passenger, Vietnamese headings.</summary>
public static class ManifestExcel
{
    public const string ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public const string SheetName = "Danh sách đoàn";
    public const int HeaderRow = 5;

    public static readonly string[] Columns =
        ["STT", "Mã đơn", "Họ tên hành khách", "Loại khách", "Ngày sinh", "Người liên hệ", "Điện thoại", "Email",
            "Trạng thái"];

    private static readonly IReadOnlyDictionary<string, string> PassengerTypes = new Dictionary<string, string>
    {
        ["adult"] = "Người lớn", ["child"] = "Trẻ em", ["infant"] = "Em bé",
    };

    private static readonly IReadOnlyDictionary<string, string> Statuses = new Dictionary<string, string>
    {
        ["pending"] = "Đang giữ chỗ", ["awaiting_supplier"] = "Chờ đối tác", ["awaiting_payment"] = "Chờ thanh toán",
        ["confirmed"] = "Đã xác nhận", ["completed"] = "Hoàn tất",
    };

    public static byte[] Build(ManifestDto manifest)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(SheetName);
        var d = manifest.Departure;
        sheet.Cell(1, 1).Value = $"{d.TourCode} – {d.TourTitle}";
        sheet.Cell(1, 1).Style.Font.Bold = true;
        sheet.Cell(2, 1).Value = $"Khởi hành {Day(d.DepartureDate)} từ {d.DepartureFrom}, về {Day(d.ReturnDate)}";
        sheet.Cell(3, 1).Value = $"Chi nhánh điều hành: {d.BranchName}. Tổng số khách: {manifest.TotalGuests}";
        for (var c = 0; c < Columns.Length; c++) sheet.Cell(HeaderRow, c + 1).Value = Columns[c];
        sheet.Row(HeaderRow).Style.Font.Bold = true;
        var row = HeaderRow;
        foreach (var line in Lines(manifest)) WriteRow(sheet, ++row, row - HeaderRow, line);
        sheet.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public static string FileName(AdminDepartureDto departure) =>
        $"doan-{departure.TourCode}-{departure.DepartureDate:yyyy-MM-dd}.xlsx";

    /// <summary>One line per named passenger; an order without names still gets a line with its head count.</summary>
    private static IEnumerable<(ManifestBookingDto Booking, string Name, string Type, DateOnly? Birth)> Lines(
        ManifestDto manifest) => manifest.Bookings.SelectMany(b => b.Passengers.Count > 0
        ? b.Passengers.Select(p => (b, p.FullName, PassengerTypes.GetValueOrDefault(p.Type, p.Type), p.BirthDate))
        : [(b, $"(chưa có tên – {b.Adults} người lớn, {b.Children} trẻ em)", "", (DateOnly?)null)]);

    private static void WriteRow(IXLWorksheet sheet, int row, int number,
        (ManifestBookingDto Booking, string Name, string Type, DateOnly? Birth) line)
    {
        var b = line.Booking;
        string[] values = [number.ToString(CultureInfo.InvariantCulture), b.Code, line.Name, line.Type,
            line.Birth is { } birth ? Day(birth) : "", b.ContactName, b.ContactPhone ?? "", b.ContactEmail,
            Statuses.GetValueOrDefault(b.Status, b.Status)];
        for (var c = 0; c < values.Length; c++) sheet.Cell(row, c + 1).Value = values[c];
    }

    private static string Day(DateOnly date) => date.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
}
