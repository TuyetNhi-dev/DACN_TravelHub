import type { IconName } from "@/components/ui/Icon";

/** Hero banner slides. `query` opens the tour list filtered to that destination. Photos come from media.ts. */
export const heroSlides = [
  { place: "Hạ Long", query: "Hạ Long", region: "Miền Bắc",
    tagline: "Hàng nghìn đảo đá vôi giữa làn nước ngọc bích, đẹp nhất khi bình minh trên vịnh." },
  { place: "Hội An", query: "Hội An", region: "Miền Trung",
    tagline: "Phố cổ vàng ươm, đèn lồng lung linh bên dòng Hoài mỗi tối." },
  { place: "Đà Nẵng", query: "Đà Nẵng", region: "Miền Trung",
    tagline: "Biển Mỹ Khê, cầu Rồng và Bà Nà Hills trong một thành phố đáng sống." },
  { place: "Phú Quốc", query: "Phú Quốc", region: "Miền Nam",
    tagline: "Đảo ngọc nắng vàng, cát trắng và hoàng hôn đỏ rực cuối ngày." },
] as const;

export type HeroSlide = (typeof heroSlides)[number];

/** Home mosaic. The first entry is the large tile; tour counts come from the API at runtime. */
export const featuredDestinations = [
  { name: "Hạ Long", region: "Miền Bắc", note: "Vịnh biển di sản" },
  { name: "Hội An", region: "Miền Trung", note: "Phố cổ đèn lồng" },
  { name: "Đà Lạt", region: "Tây Nguyên", note: "Thành phố sương mù" },
  { name: "Phú Quốc", region: "Miền Nam", note: "Đảo ngọc biển xanh" },
  { name: "Sa Pa", region: "Miền Bắc", note: "Ruộng bậc thang, biển mây" },
] as const;

/** Only claims the booking system actually enforces. */
export const promises: { icon: IconName; title: string; text: string }[] = [
  { icon: "ticket", title: "Giữ chỗ tour ngay khi đặt",
    text: "Số chỗ của lịch khởi hành được trừ ngay trong hệ thống, không bán quá sức chứa." },
  { icon: "wallet", title: "Giá tham khảo ghi rõ",
    text: "Khách sạn và vé máy bay là báo giá đối tác, luôn gắn nhãn chờ xác nhận." },
  { icon: "shield", title: "Không thu tiền khi chưa xác nhận",
    text: "Đơn khách sạn, vé máy bay chỉ được xác nhận khi đối tác báo còn phòng hoặc còn chỗ." },
  { icon: "clock", title: "Theo dõi đơn trong tài khoản",
    text: "Xem trạng thái từng dịch vụ trong đơn và hủy đơn khi chính sách cho phép." },
];

export interface NavItem {
  label: string;
  href: string;
  /** Short promo tag drawn beside the label; `ariaLabel` then names the link with it. */
  badge?: string;
  ariaLabel?: string;
}

export const navigation: readonly NavItem[] = [
  { label: "Trang chủ", href: "/" },
  { label: "Tour du lịch", href: "/tours" },
  { label: "Khách sạn", href: "/hotels" },
  { label: "Vé máy bay", href: "/flights", badge: "Săn deal", ariaLabel: "Vé máy bay, săn deal" },
  { label: "Văn phòng", href: "/branches" },
];
