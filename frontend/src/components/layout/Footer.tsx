import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { EXTRA_SERVICES, serviceHref } from "@/data/extra-services";
import { SITE_CONTACT } from "@/data/site-contact";
import { Logo } from "./Logo";

const COPYRIGHT_YEAR = 2026;
// Official logo, source in docs/design/image-credits.md. viewBox 138.32 × 42, shown 28px tall.
const VNPAY_LOGO = { src: "/payments/vnpay-logo.svg", width: 92, height: 28 };

/** Short labels keep every link on one line; the pages themselves keep their full titles. */
const LINK_COLUMNS = [
  { title: "Thông tin", links: [
    { label: "Về chúng tôi", href: "/ve-chung-toi" },
    { label: "Cẩm nang du lịch", href: "/cam-nang" },
    { label: "Trợ giúp", href: "/tro-giup" },
    { label: "Lịch âm dương", href: "/lich" },
  ] },
  { title: "Điều kiện & điều khoản", links: [
    { label: "Chính sách riêng tư", href: "/privacy" },
    { label: "Thỏa thuận sử dụng", href: "/terms" },
    { label: "Bảo vệ dữ liệu cá nhân", href: "/bao-ve-du-lieu-ca-nhan" },
    { label: "Hủy & hoàn tiền", href: "/huy-va-hoan-tien" },
  ] },
  { title: "Dịch vụ cộng thêm", links: EXTRA_SERVICES.map(service => ({
    label: service.name, href: serviceHref(service.slug),
  })) },
];

export function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div className="container site-footer-grid">
        <BrandColumn />
        {LINK_COLUMNS.map(column => (
          <nav key={column.title} aria-label={column.title}>
            <b>{column.title}</b>
            {column.links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </nav>
        ))}
        <div className="site-footer-payment">
          <b>Thanh toán an toàn</b>
          <span className="site-footer-payment-logo">
            <Image src={VNPAY_LOGO.src} alt="VNPAY" width={VNPAY_LOGO.width} height={VNPAY_LOGO.height} />
          </span>
          <span className="site-footer-payment-methods">ATM, Visa, Mastercard, JCB, QR</span>
          <small>Môi trường thử nghiệm</small>
        </div>
      </div>
      <div className="container site-footer-bottom">
        <div className="site-footer-bottom-start">
          <p>© {COPYRIGHT_YEAR} {SITE_CONTACT.brand} · Website đồ án sinh viên HUTECH - dữ liệu mô phỏng, không phải
            doanh nghiệp thật</p>
          <p className="site-footer-simulated">{SITE_CONTACT.simulatedNote}</p>
        </div>
        <p className="site-footer-bottom-end">
          <a href={SITE_CONTACT.githubUrl} target="_blank" rel="noopener noreferrer">
            <Icon name="code" size={16} />Mã nguồn GitHub
          </a>
          <span aria-hidden="true"> · </span>
          <span>Ảnh từ Unsplash</span>
        </p>
      </div>
    </footer>
  );
}

/** Logo, slogan, simulated address and email, and the hotline (see data/site-contact.ts: all simulated). */
function BrandColumn() {
  return (
    <div className="site-footer-brand">
      <Logo footer />
      <span className="site-footer-slogan">{SITE_CONTACT.tagline}</span>
      <span className="site-footer-line"><Icon name="map" size={18} />{SITE_CONTACT.address}</span>
      <span className="site-footer-line"><Icon name="mail" size={18} />{SITE_CONTACT.email}</span>
      <Link className="site-footer-hotline" href={SITE_CONTACT.contactHref}
        aria-label={`Tổng đài hỗ trợ ${SITE_CONTACT.hotline}, số mô phỏng. Xem thông tin liên hệ`}>
        <Icon name="headphones" size={22} />
        <span><strong>{SITE_CONTACT.hotline}</strong><small>Tổng đài hỗ trợ · {SITE_CONTACT.hoursShort}</small></span>
      </Link>
    </div>
  );
}
