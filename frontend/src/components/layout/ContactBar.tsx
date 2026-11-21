import Link from "next/link";
import { DepartureButton } from "@/components/departure/DepartureProvider";
import { SITE_CONTACT } from "@/data/site-contact";

/** The hotline is simulated (data/site-contact.ts), so it leads to the help page's contact section, never tel:. */
export function ContactBar() {
  return <div className="contact-bar"><div className="container contact-bar-inner">
    <Link href={SITE_CONTACT.contactHref} className="contact-hotline"
      aria-label={`Tổng đài hỗ trợ ${SITE_CONTACT.hotline}, số mô phỏng`}>
      <span>{SITE_CONTACT.brand} · </span>Hotline: <strong>{SITE_CONTACT.hotline}</strong>
    </Link>
    <div className="contact-bar-actions"><DepartureButton /><Link href={SITE_CONTACT.contactHref}>Liên hệ</Link></div>
  </div></div>;
}
