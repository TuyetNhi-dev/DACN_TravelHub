namespace TravelHub.Api.Models;

public sealed record Tour(
    string TourId,
    string? TenTour,
    string? DiemKhoiHanh,
    string? DiemDen,
    int? SoNgay,
    int? SoDem,
    string? PhuongTien,
    decimal? GiaNguoiLonVnd,
    decimal? GiaTreEmVnd,
    string? DiemThamQuan,
    string? LichTrinhTomTat,
    string? LoaiDuLieu,
    string? NguonThamKhao);

public sealed record TourDeparture(
    string DepartureId,
    string TourId,
    DateOnly? NgayKhoiHanh,
    int? SoChoCon,
    decimal? GiaNguoiLonVnd,
    string? TrangThai);

public sealed record Hotel(
    string HotelId,
    string? TenKhachSan,
    string? ThanhPho,
    string? DiaChi,
    int? HangSaoDemo,
    decimal? GiaTuVndDem,
    string? TienNghi,
    string? GhiChu,
    string? NguonThamKhao);

public sealed record Room(
    string RoomId,
    string HotelId,
    string? LoaiPhong,
    int? SucChua,
    decimal? GiaVndDem,
    int? SoPhongCon,
    string? LoaiDuLieu);

public sealed record Flight(
    string FlightId,
    string? SoHieuDemo,
    string? HangBayThamKhao,
    string? MaSanBayDi,
    string? NoiDi,
    string? MaSanBayDen,
    string? NoiDen,
    DateOnly? NgayBay,
    TimeSpan? GioDi,
    TimeSpan? GioDen,
    int? ThoiGianPhut,
    string? HangVe,
    decimal? GiaVnd,
    int? SoGheCon,
    string? GhiChu,
    string? NguonThamKhao);

public sealed record TourDetail(Tour Tour, IReadOnlyList<TourDeparture> Departures);
public sealed record HotelDetail(Hotel Hotel, IReadOnlyList<Room> Rooms);
public sealed record ListResponse<T>(IReadOnlyList<T> Data, int Count);
public sealed record ItemResponse<T>(T Data);
