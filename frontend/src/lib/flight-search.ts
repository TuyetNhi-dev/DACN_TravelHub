import { normalizeSearch } from "@/lib/format";
import { vietnamToday } from "@/lib/hotel-stay";
import type { Flight, FlightSearch } from "@/types/flight";

export const airports = [
  ["SGN", "TP. Hồ Chí Minh", "Tân Sơn Nhất"], ["HAN", "Hà Nội", "Nội Bài"],
  ["DAD", "Đà Nẵng", "Đà Nẵng"], ["CXR", "Nha Trang", "Cam Ranh"],
  ["PQC", "Phú Quốc", "Phú Quốc"], ["DLI", "Đà Lạt", "Liên Khương"],
  ["HUI", "Huế", "Phú Bài"], ["HPH", "Hải Phòng", "Cát Bi"],
  ["VII", "Vinh", "Vinh"], ["VCA", "Cần Thơ", "Cần Thơ"],
  ["UIH", "Quy Nhơn", "Phù Cát"], ["BMV", "Buôn Ma Thuột", "Buôn Ma Thuột"],
  ["VCL", "Quảng Nam", "Chu Lai"], ["VDH", "Đồng Hới", "Đồng Hới"],
  ["THD", "Thanh Hóa", "Thọ Xuân"], ["PXU", "Pleiku", "Pleiku"],
  ["TBB", "Tuy Hòa", "Tuy Hòa"], ["VCS", "Côn Đảo", "Côn Đảo"],
  ["DIN", "Điện Biên", "Điện Biên"], ["VKG", "Rạch Giá", "Rạch Giá"], ["CAH", "Cà Mau", "Cà Mau"],
] as const;
export function airportCode(text: string) {
  const q = normalizeSearch(text);
  return airports.find(a => a.some(s => normalizeSearch(s) === q) || normalizeSearch(`${a[1]} (${a[0]})`) === q)?.[0] || "";
}
export function validFlightDay(day: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day)) && new Date(day + "T00:00:00Z").toISOString().slice(0, 10) === day;
}
export function validateFlightSearch(s: FlightSearch, today = vietnamToday()) {
  if (!airportCode(s.from) || !airportCode(s.to)) return "Chọn điểm đi và đến trong danh sách sân bay nội địa.";
  if (airportCode(s.from) === airportCode(s.to)) return "Điểm đi và điểm đến phải khác nhau.";
  if (!validFlightDay(s.departure) || s.departure < today) return "Chọn ngày đi hợp lệ từ hôm nay.";
  if (s.roundTrip && (!validFlightDay(s.returning) || s.returning < s.departure)) return "Ngày về phải từ ngày đi trở đi.";
  if (!Number.isInteger(s.passengers) || s.passengers < 1 || s.passengers > 9) return "Chọn từ 1 đến 9 hành khách.";
  if (!["Phổ thông", "Thương gia"].includes(s.cabin)) return "Chọn hạng vé hợp lệ.";
  return null;
}
export function matchesFlight(f: Flight, s: FlightSearch, inbound = false) {
  return f.maSanBayDi === airportCode(inbound ? s.to : s.from)
    && f.maSanBayDen === airportCode(inbound ? s.from : s.to)
    && f.ngayBay === (inbound ? s.returning : s.departure)
    && normalizeSearch(f.hangVe || "") === normalizeSearch(s.cabin);
}
export function flightTotal(flights: Flight[], passengers: number) {
  if (!flights.length || !Number.isInteger(passengers) || passengers < 1 || passengers > 9
    || flights.some(f => f.giaVnd === null || !Number.isSafeInteger(f.giaVnd) || f.giaVnd < 0)) return null;
  const total = flights.reduce((sum, f) => sum + (f.giaVnd ?? 0), 0) * passengers;
  return Number.isSafeInteger(total) ? total : null;
}
export function flightBookingIssue(flights: Flight[], s: FlightSearch) {
  const issue = validateFlightSearch(s);
  if (issue) return issue;
  if (flights.length !== (s.roundTrip ? 2 : 1) || !flights.every((f, i) => matchesFlight(f, s, i === 1))) return "Vui lòng chọn đủ chuyến đi và về đúng hành trình.";
  if (flights.some(f => f.soGheCon !== null && f.soGheCon < s.passengers)) return "Số ghế tham khảo không đủ cho nhóm hành khách.";
  if (flightTotal(flights, s.passengers) === null) return "Chưa có giá hợp lệ để tính tổng dự kiến.";
  if (s.roundTrip && s.departure === s.returning && (!flights[0].gioDen || !flights[1].gioDi || flights[1].gioDi <= flights[0].gioDen)) return "Chuyến về cần khởi hành sau giờ đến của chuyến đi.";
  return null;
}
