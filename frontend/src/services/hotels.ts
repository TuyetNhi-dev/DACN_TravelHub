import { apiGet, ApiError } from "@/lib/api-client";
import type { Hotel, HotelDetail, HotelRoom } from "@/types/hotel";

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const strings = (r: Record<string, unknown>, keys: string[]) =>
  keys.every(k => r[k] === null || typeof r[k] === "string");
const numbers = (r: Record<string, unknown>, keys: string[]) =>
  keys.every(k => r[k] === null || (typeof r[k] === "number" && Number.isSafeInteger(r[k]) && r[k] >= 0));
const id = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= 12;
function isHotel(v: unknown): v is Hotel {
  return record(v) && id(v.hotelId) && strings(v, ["tenKhachSan", "thanhPho", "diaChi", "tienNghi", "ghiChu", "nguonThamKhao"])
    && numbers(v, ["hangSaoDemo", "giaTuVndDem"]) && (v.hangSaoDemo === null || (v.hangSaoDemo as number) <= 5);
}
function isRoom(v: unknown): v is HotelRoom {
  return record(v) && id(v.roomId) && id(v.hotelId) && strings(v, ["loaiPhong", "loaiDuLieu"])
    && numbers(v, ["sucChua", "giaVndDem", "soPhongCon"]);
}
function invalid(): never { throw new ApiError("Dữ liệu khách sạn chưa đúng định dạng."); }
export function decodeHotels(v: unknown): Hotel[] {
  if (!record(v) || !Array.isArray(v.data) || !v.data.every(isHotel) || v.count !== v.data.length
    || new Set(v.data.map(h => h.hotelId)).size !== v.data.length) return invalid();
  return v.data;
}
export function decodeHotel(v: unknown, hotelId: string): HotelDetail {
  if (!record(v) || !record(v.data) || !isHotel(v.data.hotel) || v.data.hotel.hotelId !== hotelId
    || !Array.isArray(v.data.rooms) || !v.data.rooms.every(isRoom)
    || !v.data.rooms.every(r => r.hotelId === hotelId)
    || new Set(v.data.rooms.map(r => r.roomId)).size !== v.data.rooms.length) return invalid();
  return { hotel: v.data.hotel, rooms: v.data.rooms };
}
export async function getHotels(signal?: AbortSignal) { return decodeHotels(await apiGet("/api/hotels", signal)); }
export async function getHotel(hotelId: string, signal?: AbortSignal) {
  if (!id(hotelId)) throw new ApiError("Không tìm thấy khách sạn.", 404);
  return decodeHotel(await apiGet("/api/hotels/" + encodeURIComponent(hotelId), signal), hotelId);
}
