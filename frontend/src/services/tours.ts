import { apiGet, ApiError } from "@/lib/api-client";
import type { Tour, TourDeparture, TourDetail, TourListResponse } from "@/types/tour";

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function nullableStrings(row: Record<string, unknown>, keys: string[]) {
  return keys.every(key => row[key] === null || typeof row[key] === "string");
}
function nullableNumbers(row: Record<string, unknown>, keys: string[]) {
  return keys.every(key => row[key] === null ||
    (typeof row[key] === "number" && Number.isSafeInteger(row[key])));
}
function isTour(value: unknown): value is Tour {
  return record(value) && typeof value.tourId === "string" &&
    nullableStrings(value, ["tenTour", "diemKhoiHanh", "diemDen", "phuongTien",
      "diemThamQuan", "lichTrinhTomTat", "loaiDuLieu", "nguonThamKhao"]) &&
    nullableNumbers(value, ["soNgay", "soDem", "giaNguoiLonVnd", "giaTreEmVnd"]);
}
function isDeparture(value: unknown): value is TourDeparture {
  return record(value) && typeof value.departureId === "string" &&
    typeof value.tourId === "string" &&
    nullableStrings(value, ["ngayKhoiHanh", "trangThai"]) &&
    (value.ngayKhoiHanh === null || /^\d{4}-\d{2}-\d{2}$/.test(value.ngayKhoiHanh as string)) &&
    nullableNumbers(value, ["soChoCon", "giaNguoiLonVnd"]);
}
function invalidResponse(): never {
  throw new ApiError("Dữ liệu tour trả về chưa đúng định dạng.");
}
export async function getTours(signal?: AbortSignal): Promise<TourListResponse> {
  const value = await apiGet("/api/tours", signal);
  if (!record(value) || !Array.isArray(value.data) || !value.data.every(isTour) ||
      !Number.isSafeInteger(value.count) || value.count !== value.data.length)
    return invalidResponse();
  return { data: value.data, count: value.count as number };
}
export async function getTour(id: string, signal?: AbortSignal): Promise<TourDetail> {
  const value = await apiGet("/api/tours/" + encodeURIComponent(id), signal);
  if (!record(value) || !record(value.data) || !isTour(value.data.tour) ||
      value.data.tour.tourId !== id || !Array.isArray(value.data.departures) ||
      !value.data.departures.every(isDeparture) ||
      !value.data.departures.every(item => item.tourId === id))
    return invalidResponse();
  return { tour: value.data.tour, departures: value.data.departures };
}
