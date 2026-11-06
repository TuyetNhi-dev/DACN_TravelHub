import { apiGet, ApiError } from "@/lib/api-client";

export type CatalogKind = "hotel" | "flight";
export interface CatalogItem {
  id: string; title: string; location: string; price: number | null;
  note: string | null; date: string | null; origin: string | null;
}

/** Read existing public endpoints. Never replace a failed request with invented stock/prices. */
export async function getHomeCatalog(kind: CatalogKind, signal?: AbortSignal): Promise<CatalogItem[]> {
  const value = await apiGet(kind === "hotel" ? "/api/hotels" : "/api/flights", signal);
  if (!value || typeof value !== "object" || !("data" in value) || !Array.isArray(value.data))
    throw new ApiError("Dữ liệu dịch vụ chưa đúng định dạng.");
  return value.data.map((row: unknown) => {
    if (!row || typeof row !== "object") throw new ApiError("Dữ liệu dịch vụ chưa đúng định dạng.");
    const r = row as Record<string, unknown>;
    const str = (key: string) => {
      if (r[key] === null) return null;
      if (typeof r[key] !== "string") throw new ApiError("Dữ liệu dịch vụ chưa đúng định dạng.");
      return r[key] as string;
    };
    const id = str(kind === "hotel" ? "hotelId" : "flightId");
    const price = r[kind === "hotel" ? "giaTuVndDem" : "giaVnd"];
    if (!id || (price !== null && (typeof price !== "number" || !Number.isSafeInteger(price) || price < 0)))
      throw new ApiError("Dữ liệu dịch vụ chưa đúng định dạng.");
    return { id, title: str(kind === "hotel" ? "tenKhachSan" : "hangBayThamKhao") || "Chưa có tên",
      location: str(kind === "hotel" ? "thanhPho" : "noiDen") || "Chưa có điểm đến",
      origin: kind === "flight" ? str("noiDi") : null,
      date: kind === "flight" ? str("ngayBay") : null,
      price: price as number | null, note: str("ghiChu") };
  });
}
