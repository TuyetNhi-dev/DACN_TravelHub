import { apiGet, ApiError } from "@/lib/api-client";
import type { Flight } from "@/types/flight";

export function decodeFlights(value: unknown): Flight[] {
  if (!value || typeof value !== "object" || !("data" in value) || !("count" in value)
    || !Array.isArray(value.data) || value.count !== value.data.length) throw new ApiError("Dữ liệu chuyến bay không hợp lệ.");
  const strings = ["soHieuDemo", "hangBayThamKhao", "maSanBayDi", "noiDi", "maSanBayDen", "noiDen", "ngayBay", "gioDi", "gioDen", "hangVe", "ghiChu", "nguonThamKhao"];
  const numbers = ["thoiGianPhut", "giaVnd", "soGheCon"];
  const rows: Flight[] = [];
  for (const item of value.data as unknown[]) {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new ApiError("Dữ liệu chuyến bay không hợp lệ.");
    const row = item as Record<string, unknown>;
    if (typeof row.flightId !== "string" || !row.flightId.trim()
      || !strings.every(k => row[k] === null || typeof row[k] === "string")
      || !numbers.every(k => row[k] === null || (typeof row[k] === "number" && Number.isSafeInteger(row[k]) && row[k] >= 0))) throw new ApiError("Dữ liệu chuyến bay không hợp lệ.");
    rows.push(row as unknown as Flight);
  }
  if (new Set(rows.map(f => f.flightId)).size !== rows.length) throw new ApiError("Mã chuyến bay bị trùng.");
  return rows;
}
export async function getFlights(signal?: AbortSignal) {
  return decodeFlights(await apiGet("/api/flights", signal));
}
