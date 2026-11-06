import type { HotelRoom, HotelSource, Stay } from "@/types/hotel";

export function splitAmenities(value: string | null): string[] {
  return (value || "").split(/[;,|\n]/).map(item => item.trim()).filter(Boolean);
}
export function vietnamToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(k => parts.find(p => p.type === k)!.value).join("-");
}
function dayValue(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00Z");
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date.getTime();
}
export function stayNights(stay: Pick<Stay, "checkIn" | "checkOut">) {
  const start = dayValue(stay.checkIn), end = dayValue(stay.checkOut);
  return start === null || end === null || end <= start ? 0 : (end - start) / 86400000;
}
export function validateStay(stay: Stay, today = vietnamToday(), required = true): string | null {
  if (!stay.checkIn && !stay.checkOut && !required) {
    // A catalogue search may omit both dates; a booking may not.
  } else {
    if (dayValue(stay.checkIn) === null || dayValue(stay.checkOut) === null) return "Vui lòng chọn đủ ngày nhận và trả phòng hợp lệ.";
    if (stay.checkIn < today) return "Ngày nhận phòng không được ở trong quá khứ.";
    if (!stayNights(stay)) return "Ngày trả phòng phải sau ngày nhận phòng.";
    if (stayNights(stay) > 30) return "Bản demo hỗ trợ tối đa 30 đêm mỗi lần đặt.";
  }
  if (!Number.isInteger(stay.guests) || stay.guests < 1 || stay.guests > 20) return "Số khách phải từ 1 đến 20.";
  if (!Number.isInteger(stay.rooms) || stay.rooms < 1 || stay.rooms > 10) return "Số phòng phải từ 1 đến 10.";
  if (stay.rooms > stay.guests) return "Mỗi phòng cần có ít nhất một khách.";
  return null;
}
export function roomBookingIssue(room: HotelRoom, stay: Stay, today = vietnamToday()) {
  const issue = validateStay(stay, today);
  if (issue) return issue;
  if (room.sucChua === null || room.sucChua < 1) return "Chưa có thông tin sức chứa phòng.";
  if (stay.guests > room.sucChua * stay.rooms) return "Số khách vượt sức chứa của loại phòng này.";
  if (room.soPhongCon !== null && stay.rooms > room.soPhongCon) return "Số phòng yêu cầu vượt số lượng tham khảo trong danh mục.";
  if (room.giaVndDem === null) return "Chưa có giá phòng để tính tổng demo.";
  if (!Number.isSafeInteger(room.giaVndDem * stayNights(stay) * stay.rooms)) return "Tổng tiền vượt giới hạn hỗ trợ.";
  return null;
}
export function stayTotal(room: HotelRoom, stay: Stay): number | null {
  const nights = stayNights(stay);
  if (room.giaVndDem === null || !nights || !Number.isInteger(stay.rooms) || stay.rooms < 1) return null;
  const total = room.giaVndDem * nights * stay.rooms;
  return Number.isSafeInteger(total) ? total : null;
}
export const displayStayDate = (s: string) => dayValue(s) === null ? "Chưa chọn" : s.split("-").reverse().join("/");
export function stayParams(stay: Stay, source: HotelSource, query = "") {
  const params = new URLSearchParams({
    source,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    guests: String(stay.guests),
    rooms: String(stay.rooms),
  });
  if (query.trim()) params.set("q", query.trim());
  return params;
}
export function parseStay(params: Record<string, string | string[] | undefined>): Stay {
  const text = (key: string) => typeof params[key] === "string" ? (params[key] as string).slice(0, 200) : "";
  const count = (key: string, fallback: number) => {
    const raw = text(key);
    if (!raw) return fallback;
    const value = Number(raw);
    return Number.isSafeInteger(value) ? value : 0;
  };
  return { checkIn: text("checkIn"), checkOut: text("checkOut"),
    guests: count("guests", 2), rooms: count("rooms", 1) };
}
export function validateContact(name: string, email: string, phone: string) {
  if (name.trim().length < 2 || name.trim().length > 100) return "Họ tên cần có từ 2 đến 100 ký tự.";
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Vui lòng nhập email hợp lệ.";
  if (!/^\+?[\d\s().-]{9,20}$/.test(phone.trim()) || phone.replace(/\D/g, "").length < 9) return "Vui lòng nhập số điện thoại hợp lệ.";
  return null;
}
