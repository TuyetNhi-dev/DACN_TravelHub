import type { HotelDetail } from "@/types/hotel";

/** Explicitly selected UI fixtures; never an automatic replacement for a failing API. */
export const demoHotelDetails: HotelDetail[] = [
  { hotel: { hotelId: "DEMO-H01", tenKhachSan: "SàiHành Coast Retreat", thanhPho: "Đà Nẵng", diaChi: "Khu vực biển Mỹ Khê, Đà Nẵng · địa chỉ minh họa", hangSaoDemo: 4, giaTuVndDem: 1250000, tienNghi: "Wi-Fi; Hồ bơi; Bữa sáng; Chỗ đỗ xe", ghiChu: "Khách sạn và giá giả định phục vụ trải nghiệm giao diện; không phải cơ sở lưu trú đang mở bán.", nguonThamKhao: "Dữ liệu demo frontend SàiHành" }, rooms: [
    { roomId: "DEMO-R01", hotelId: "DEMO-H01", loaiPhong: "Deluxe · 1 giường đôi", sucChua: 2, giaVndDem: 1250000, soPhongCon: 4, loaiDuLieu: "Demo frontend" },
    { roomId: "DEMO-R02", hotelId: "DEMO-H01", loaiPhong: "Family Suite · 2 giường đôi", sucChua: 4, giaVndDem: 2100000, soPhongCon: 2, loaiDuLieu: "Demo frontend" }] },
  { hotel: { hotelId: "DEMO-H02", tenKhachSan: "SàiHành Phố Hội Villa", thanhPho: "Hội An", diaChi: "Khu vực phố cổ Hội An · địa chỉ minh họa", hangSaoDemo: 3, giaTuVndDem: 890000, tienNghi: "Wi-Fi; Bữa sáng; Xe đạp; Sân vườn", ghiChu: "Biệt thự và giá giả định để xem thử quy trình đặt phòng.", nguonThamKhao: "Dữ liệu demo frontend SàiHành" }, rooms: [
    { roomId: "DEMO-R03", hotelId: "DEMO-H02", loaiPhong: "Garden Room · 1 giường đôi", sucChua: 2, giaVndDem: 890000, soPhongCon: 3, loaiDuLieu: "Demo frontend" },
    { roomId: "DEMO-R04", hotelId: "DEMO-H02", loaiPhong: "Family Garden · 3 khách", sucChua: 3, giaVndDem: 1390000, soPhongCon: 0, loaiDuLieu: "Demo frontend" }] },
  { hotel: { hotelId: "DEMO-H03", tenKhachSan: "SàiHành Bay View", thanhPho: "Hạ Long", diaChi: "Khu vực Bãi Cháy, Hạ Long · địa chỉ minh họa", hangSaoDemo: 5, giaTuVndDem: 1680000, tienNghi: "Wi-Fi; Hồ bơi; Phòng gym; Bữa sáng; Chỗ đỗ xe", ghiChu: "Khách sạn hư cấu. Hạng sao, số lượng phòng và giá chỉ phục vụ demo.", nguonThamKhao: "Dữ liệu demo frontend SàiHành" }, rooms: [
    { roomId: "DEMO-R05", hotelId: "DEMO-H03", loaiPhong: "Bay Deluxe · 2 khách", sucChua: 2, giaVndDem: 1680000, soPhongCon: 5, loaiDuLieu: "Demo frontend" },
    { roomId: "DEMO-R06", hotelId: "DEMO-H03", loaiPhong: "Bay Suite · 4 khách", sucChua: 4, giaVndDem: 2890000, soPhongCon: 1, loaiDuLieu: "Demo frontend" }] },
  { hotel: { hotelId: "DEMO-H04", tenKhachSan: "SàiHành Riverside Stay", thanhPho: "Cần Thơ", diaChi: "Khu vực bến Ninh Kiều, Cần Thơ · địa chỉ minh họa", hangSaoDemo: 3, giaTuVndDem: 720000, tienNghi: "Wi-Fi; Bữa sáng; Chỗ đỗ xe", ghiChu: "Khách sạn và giá giả định cho giao diện demo.", nguonThamKhao: "Dữ liệu demo frontend SàiHành" }, rooms: [
    { roomId: "DEMO-R07", hotelId: "DEMO-H04", loaiPhong: "Standard · 2 khách", sucChua: 2, giaVndDem: 720000, soPhongCon: 6, loaiDuLieu: "Demo frontend" }] },
];
