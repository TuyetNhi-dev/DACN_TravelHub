import type { Tour } from "@/types/tour";

export const DEPARTURE_STORAGE_KEY = "travelhub-departure-region-v1";
export const regions = [
  { id: "hcm", label: "TP. Hồ Chí Minh" },
  { id: "north", label: "Miền Bắc" },
  { id: "central", label: "Miền Trung" },
  { id: "highlands", label: "Tây Nguyên" },
  { id: "southeast", label: "Miền Đông Nam Bộ" },
  { id: "southwest", label: "Miền Tây Nam Bộ" },
] as const;
export type Region = typeof regions[number]["id"] | "all";
export const validRegion = (value: unknown): value is Region =>
  value === "all" || regions.some(region => region.id === value);
export const regionLabel = (region: Region) =>
  regions.find(item => item.id === region)?.label || "Tất cả điểm khởi hành";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[.,-]/g, " ")
  .replace(/^(thanh pho|tinh|tp)\s*/, "").replace(/\s+/g, " ").trim();

// UX geographic aliases for literal departure labels, including legacy province names.
// These are NOT an administrative boundary lookup: never infer the territory of merged provinces.
const names = {
  north: ["Hà Nội", "Hà Giang", "Cao Bằng", "Bắc Kạn", "Tuyên Quang", "Lào Cai",
    "Điện Biên", "Lai Châu", "Sơn La", "Yên Bái", "Hòa Bình", "Thái Nguyên",
    "Lạng Sơn", "Quảng Ninh", "Bắc Giang", "Phú Thọ", "Vĩnh Phúc", "Bắc Ninh",
    "Hải Dương", "Hải Phòng", "Hưng Yên", "Thái Bình", "Hà Nam", "Nam Định", "Ninh Bình"],
  central: ["Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Huế",
    "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên",
    "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Nha Trang", "Quy Nhơn", "Đồng Hới", "Tam Kỳ"],
  highlands: ["Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng",
    "Buôn Ma Thuột", "Buôn Mê Thuột", "Pleiku", "Đà Lạt"],
  southeast: ["Hồ Chí Minh", "HCM", "TPHCM", "Sài Gòn", "Bình Phước", "Tây Ninh",
    "Bình Dương", "Đồng Nai", "Bà Rịa Vũng Tàu", "Vũng Tàu", "Biên Hòa", "Thủ Dầu Một"],
  southwest: ["Long An", "Tiền Giang", "Bến Tre", "Trà Vinh", "Vĩnh Long",
    "Đồng Tháp", "An Giang", "Kiên Giang", "Cần Thơ", "Hậu Giang", "Sóc Trăng",
    "Bạc Liêu", "Cà Mau", "Phú Quốc", "Rạch Giá", "Mỹ Tho", "Long Xuyên", "Châu Đốc"],
} as const;
const hcm = new Set(["Hồ Chí Minh", "HCM", "TPHCM", "Sài Gòn"].map(normalize));
export function departureRegion(value: string | null): Exclude<Region, "all" | "hcm"> | null {
  if (!value) return null;
  const key = normalize(value);
  for (const [region, aliases] of Object.entries(names))
    if (aliases.some(alias => normalize(alias) === key))
      return region as Exclude<Region, "all" | "hcm">;
  return null;
}
export function filterByDeparture(tours: Tour[], region: Region) {
  if (region === "all") return tours;
  return tours.filter(tour => region === "hcm" ?
    tour.diemKhoiHanh !== null && hcm.has(normalize(tour.diemKhoiHanh)) :
    departureRegion(tour.diemKhoiHanh) === region);
}
