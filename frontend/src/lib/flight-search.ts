import { normalizeSearch, vietnamToday, vietnamDay } from "@/lib/format";
import type { CabinClass, FlightOffer, FlightSearch } from "@/types/flight";

export const MAX_FLIGHT_PASSENGERS = 9;

export const CABIN_CLASSES: readonly { value: CabinClass; label: string }[] = [
  { value: "economy", label: "Phổ thông" },
  { value: "premium_economy", label: "Phổ thông đặc biệt" },
  { value: "business", label: "Thương gia" },
  { value: "first", label: "Hạng nhất" },
];

/** Domestic airports offered in the search box: [IATA code, city, airport name]. */
export const AIRPORTS = [
  ["SGN", "TP. Hồ Chí Minh", "Tân Sơn Nhất"], ["HAN", "Hà Nội", "Nội Bài"],
  ["DAD", "Đà Nẵng", "Đà Nẵng"], ["CXR", "Nha Trang", "Cam Ranh"],
  ["PQC", "Phú Quốc", "Phú Quốc"], ["DLI", "Đà Lạt", "Liên Khương"],
  ["HUI", "Huế", "Phú Bài"], ["HPH", "Hải Phòng", "Cát Bi"],
  ["VII", "Vinh", "Vinh"], ["VCA", "Cần Thơ", "Cần Thơ"],
  ["UIH", "Quy Nhơn", "Phù Cát"], ["BMV", "Buôn Ma Thuột", "Buôn Ma Thuột"],
  ["VDH", "Đồng Hới", "Đồng Hới"], ["THD", "Thanh Hóa", "Thọ Xuân"],
  ["PXU", "Pleiku", "Pleiku"], ["VCS", "Côn Đảo", "Côn Đảo"], ["VDO", "Vân Đồn", "Vân Đồn"],
] as const;

export type FlightSort = "price" | "departure" | "duration";

export interface FlightFilters {
  airline: string;
  maxPrice: string;
  period: string;
  sort: FlightSort;
}

export const EMPTY_FLIGHT_FILTERS: FlightFilters = { airline: "", maxPrice: "", period: "", sort: "price" };

/** Day periods used by the departure-time filter, by starting hour. */
export const DAY_PERIODS = [
  { value: "0", label: "Sáng sớm (00:00–05:59)" },
  { value: "1", label: "Buổi sáng (06:00–11:59)" },
  { value: "2", label: "Buổi chiều (12:00–17:59)" },
  { value: "3", label: "Buổi tối (18:00–23:59)" },
] as const;

const HOURS_PER_PERIOD = 6;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FLEXIBLE_FLAG = "1";

export function cabinLabel(value: string): string {
  return CABIN_CLASSES.find(item => item.value === value)?.label ?? value;
}

export function airportCode(text: string): string {
  const query = normalizeSearch(text);
  return AIRPORTS.find(airport => airport.some(part => normalizeSearch(part) === query))?.[0] ?? "";
}

export function airportLabel(code: string): string {
  const airport = AIRPORTS.find(item => item[0] === code);
  return airport ? `${airport[1]} (${airport[0]})` : code;
}

function travelDatesIssue(search: FlightSearch, today: string): string | null {
  if (!ISO_DATE.test(search.date) || search.date < today) return "Chọn ngày bay từ hôm nay trở đi.";
  if (search.returnDate === undefined) return null;
  return ISO_DATE.test(search.returnDate) && search.returnDate >= search.date
    ? null : "Ngày về phải từ ngày đi trở đi.";
}

export function validateFlightSearch(search: FlightSearch, today = vietnamToday()): string | null {
  const from = airportCode(search.from);
  const to = airportCode(search.to);
  if (!from || !to) return "Chọn điểm đi và điểm đến trong danh sách sân bay nội địa.";
  if (from === to) return "Điểm đi và điểm đến phải khác nhau.";
  const dateIssue = travelDatesIssue(search, today);
  if (dateIssue) return dateIssue;
  if (!Number.isInteger(search.passengers) || search.passengers < 1 || search.passengers > MAX_FLIGHT_PASSENGERS)
    return `Chọn từ 1 đến ${MAX_FLIGHT_PASSENGERS} hành khách.`;
  if (!CABIN_CLASSES.some(item => item.value === search.cabin)) return "Chọn hạng vé hợp lệ.";
  return null;
}

export function parseFlightSearch(params: Record<string, string>): FlightSearch {
  const passengers = Number(params.passengers || 1);
  const cabin = CABIN_CLASSES.find(item => item.value === params.cabin)?.value ?? "economy";
  return {
    from: params.from || "SGN",
    to: params.to || "HAN",
    date: params.date || "",
    passengers: Number.isSafeInteger(passengers) ? passengers : 1,
    cabin,
    returnDate: params.returnDate || undefined,
    flexible: params.returnDate ? params.flex === FLEXIBLE_FLAG : undefined,
  };
}

export function flightSearchParams(search: FlightSearch): URLSearchParams {
  const params = new URLSearchParams({
    from: airportCode(search.from) || search.from,
    to: airportCode(search.to) || search.to,
    date: search.date,
    passengers: String(search.passengers),
    cabin: search.cabin,
  });
  if (search.returnDate) params.set("returnDate", search.returnDate);
  if (search.returnDate && search.flexible) params.set("flex", FLEXIBLE_FLAG);
  return params;
}

/** The same search flown the other way on the return date, for the return-leg results and booking. */
export function returnLegSearch(search: FlightSearch): FlightSearch {
  return {
    from: search.to, to: search.from, date: search.returnDate ?? "", passengers: search.passengers,
    cabin: search.cabin,
  };
}

function departureHour(offer: FlightOffer): number {
  return Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", hour12: false,
  }).format(new Date(offer.departAt)));
}

export function applyFlightFilters(offers: FlightOffer[], filters: FlightFilters): FlightOffer[] {
  const rows = offers.filter(offer =>
    (!filters.airline || offer.airline === filters.airline)
    && (!filters.maxPrice || offer.referencePrice <= Number(filters.maxPrice))
    && (!filters.period || Math.floor(departureHour(offer) / HOURS_PER_PERIOD) === Number(filters.period)));
  const compare: Record<FlightSort, (a: FlightOffer, b: FlightOffer) => number> = {
    price: (a, b) => a.referencePrice - b.referencePrice,
    departure: (a, b) => a.departAt.localeCompare(b.departAt),
    duration: (a, b) => a.durationMinutes - b.durationMinutes,
  };
  return [...rows].sort(compare[filters.sort]);
}

export function flightTotal(offer: FlightOffer, passengers: number): number {
  return offer.referencePrice * passengers;
}

export function flightDay(offer: FlightOffer): string {
  return vietnamDay(offer.departAt);
}
