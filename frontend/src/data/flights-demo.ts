import { airports, airportCode } from "@/lib/flight-search";
import type { Flight, FlightSearch } from "@/types/flight";

/** Synthetic catalogue for the explicitly selected demo mode; never an API fallback. */
export function demoFlights(search: FlightSearch): Flight[] {
  return [false, ...(search.roundTrip ? [true] : [])].flatMap(inbound => {
    const from = airportCode(inbound ? search.to : search.from), to = airportCode(inbound ? search.from : search.to);
    if (!from || !to) return [];
    return ["Vietnam Airlines", "Vietjet Air", "Bamboo Airways", "Vietnam Airlines"].map((airline, i) => ({
      flightId: `${inbound ? "R" : "D"}${i}`, soHieuDemo: `DEMO-${i + 1}`, hangBayThamKhao: airline,
      maSanBayDi: from, maSanBayDen: to, noiDi: airports.find(a => a[0] === from)?.[1] ?? null,
      noiDen: airports.find(a => a[0] === to)?.[1] ?? null, ngayBay: inbound ? search.returning : search.departure,
      gioDi: `${String(6 + i * 4).padStart(2, "0")}:00:00`, gioDen: `${String(8 + i * 4).padStart(2, "0")}:10:00`,
      thoiGianPhut: 130, hangVe: search.cabin, giaVnd: (search.cabin === "Thương gia" ? 3200000 : 1050000) + i * 240000,
      soGheCon: i === 3 ? 0 : 9, ghiChu: "Chuyến bay, giờ và giá hoàn toàn mô phỏng. Không có dữ liệu hành lý, đổi/hủy, thuế hoặc phí.",
      nguonThamKhao: "Dữ liệu demo SàiHành; không phải lịch bay hay giá thời gian thực.",
    }));
  });
}
