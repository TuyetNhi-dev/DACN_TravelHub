import Link from "next/link";
import { DepartureButton } from "@/components/departure/DepartureProvider";

export function ContactBar() {
  return <div className="contact-bar"><div className="container contact-bar-inner">
    <a href="tel:19006886" className="contact-hotline" aria-label="Gọi hotline 1900 6886"><span>SàiHành · </span>Hotline: <strong>1900 6886</strong></a>
    <div className="contact-bar-actions"><DepartureButton /><Link href="/#contact">Liên hệ</Link></div>
  </div></div>;
}
