import type { HotelAmenity } from "@/types/hotel";

/** Mirrors the CHECK list in migrations/005; the order is the order groups appear on the page. */
export const AMENITY_CATEGORIES = [
  { code: "internet", label: "Internet" },
  { code: "room", label: "Tiện nghi phòng" },
  { code: "bathroom", label: "Phòng tắm" },
  { code: "food", label: "Ăn uống" },
  { code: "service", label: "Dịch vụ khách sạn" },
  { code: "wellness", label: "Thư giãn & thể thao" },
  { code: "family", label: "Gia đình & trẻ em" },
  { code: "transport", label: "Di chuyển" },
  { code: "safety", label: "An ninh & an toàn" },
  { code: "accessibility", label: "Hỗ trợ tiếp cận" },
  { code: "business", label: "Công tác" },
] as const;

export type AmenityCategory = (typeof AMENITY_CATEGORIES)[number]["code"] | "other";

export interface AmenityGroup {
  category: AmenityCategory;
  label: string;
  items: HotelAmenity[];
}

const OTHER_GROUP_LABEL = "Tiện nghi khác";
export const MAX_HIGHLIGHTS = 8;

/** Groups in page order; a category the frontend does not know yet lands in "Tiện nghi khác". */
export function groupAmenities(amenities: HotelAmenity[]): AmenityGroup[] {
  const known = AMENITY_CATEGORIES.map(category => ({
    category: category.code as AmenityCategory,
    label: category.label,
    items: amenities.filter(item => item.category === category.code),
  }));
  const codes = new Set<string>(AMENITY_CATEGORIES.map(category => category.code));
  const other = { category: "other" as const, label: OTHER_GROUP_LABEL,
    items: amenities.filter(item => !codes.has(item.category)) };
  return [...known, other].filter(group => group.items.length > 0);
}

export function amenityHighlights(amenities: HotelAmenity[]): HotelAmenity[] {
  return amenities.filter(item => item.isHighlight).slice(0, MAX_HIGHLIGHTS);
}

/** Mirrors the CHECK list in migrations/005, in the order the API returns them. */
export const POLICY_LABELS: Record<string, string> = {
  cancellation: "Hủy phòng",
  children: "Trẻ em",
  extra_bed: "Giường phụ",
  payment: "Thanh toán",
  deposit: "Đặt cọc",
  pets: "Thú cưng",
  smoking: "Hút thuốc",
};

export function policyLabel(type: string): string {
  return POLICY_LABELS[type] ?? "Quy định khác";
}
