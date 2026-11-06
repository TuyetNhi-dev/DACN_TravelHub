import Link from "next/link";
import { Logo } from "./Logo";
export function Footer() { return (      <footer id="contact">
        <div className="container footer-grid">
          <div><Logo footer /><p>Nền tảng du lịch trực tuyến giúp bạn kiến tạo những hành trình đáng nhớ.</p></div>
          <div><b>Về SàiHành</b><Link href="/#about">Giới thiệu</Link><Link href="/#contact">Liên hệ</Link><span>Điều khoản: đang cập nhật</span></div>
          <div><b>Dịch vụ</b><Link href="/tours">Tour du lịch</Link><Link href="/hotels">Khách sạn</Link><Link href="/flights">Vé máy bay</Link></div>
          <div><b>Hỗ trợ khách hàng</b><a href="tel:19006886">1900 6886</a><span>Email hỗ trợ: đang cập nhật</span><span>08:00 – 22:00 hàng ngày</span></div>
        </div>
        <div className="container copyright">© 2026 SàiHành. Bản quyền thuộc về SàiHành Việt Nam.<span>Chính sách bảo mật và điều khoản: đang cập nhật</span></div>
      </footer>
); }

