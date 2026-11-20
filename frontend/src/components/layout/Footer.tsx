import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { EXTRA_SERVICES, serviceHref } from "@/data/extra-services";
import { Logo } from "./Logo";

const HOTLINE = "1900 6886";
const HOTLINE_TEL = "tel:19006886";
const COPYRIGHT_YEAR = 2026;

const COLUMNS = [
  { title: "Dịch vụ", links: [
    { label: "Tour du lịch", href: "/tours" },
    { label: "Khách sạn", href: "/hotels" },
    { label: "Vé máy bay", href: "/flights" },
    { label: "Săn vé rẻ", href: "/flights/deals" },
    { label: "Hệ thống văn phòng", href: "/branches" },
    { label: "Lịch âm dương", href: "/lich" },
  ] },
  { title: "Dịch vụ cộng thêm", links: EXTRA_SERVICES.map(service => ({
    label: service.name, href: serviceHref(service.slug),
  })) },
  { title: "Tài khoản", links: [
    { label: "Đăng nhập", href: "/login" },
    { label: "Đăng ký", href: "/register" },
    { label: "Đơn của tôi", href: "/bookings" },
  ] },
];

export function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div className="container site-footer-grid">
        <div className="site-footer-brand">
          <Logo footer />
          <p>Đặt tour, khách sạn và vé máy bay nội địa. Tour giữ chỗ ngay; khách sạn và vé máy bay là báo giá
            đối tác, chờ xác nhận.</p>
        </div>
        {COLUMNS.map(column => (
          <nav key={column.title} aria-label={column.title}>
            <b>{column.title}</b>
            {column.links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </nav>
        ))}
        <div>
          <b>Hỗ trợ khách hàng</b>
          <a className="site-footer-hotline" href={HOTLINE_TEL}><Icon name="headphones" size={18} />{HOTLINE}</a>
          <span>08:00 – 22:00 hằng ngày</span>
          <span>Email hỗ trợ: đang cập nhật</span>
        </div>
      </div>
      <div className="container site-footer-bottom">
        <span>© {COPYRIGHT_YEAR} SàiHành. Đồ án chuyên ngành, dữ liệu danh mục là dữ liệu demo.</span>
        <span className="site-footer-legal">
          <Link href="/terms">Điều khoản sử dụng</Link>
          <Link href="/privacy">Chính sách bảo mật</Link>
          <span>Ảnh minh họa từ Unsplash.</span>
        </span>
      </div>
    </footer>
  );
}
