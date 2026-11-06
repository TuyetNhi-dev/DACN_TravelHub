/** Existing ASP.NET public JSON contracts. Null means unknown, never zero stock. */
export interface Hotel {
  hotelId: string;
  tenKhachSan: string | null;
  thanhPho: string | null;
  diaChi: string | null;
  hangSaoDemo: number | null;
  giaTuVndDem: number | null;
  tienNghi: string | null;
  ghiChu: string | null;
  nguonThamKhao: string | null;
}
export interface HotelRoom {
  roomId: string;
  hotelId: string;
  loaiPhong: string | null;
  sucChua: number | null;
  giaVndDem: number | null;
  soPhongCon: number | null;
  loaiDuLieu: string | null;
}
export interface HotelDetail { hotel: Hotel; rooms: HotelRoom[] }
export type HotelSource = "api" | "demo";
export interface Stay { checkIn: string; checkOut: string; guests: number; rooms: number }
