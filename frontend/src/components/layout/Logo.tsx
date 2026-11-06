import Link from "next/link";
import Image from "next/image";
import brandLogo from "../../../public/branding/saihanh-logo-transparent.png";
import horizontalLogo from "../../../public/branding/saihanh-logo-horizontal.png";
export function Logo({ footer = false }: { footer?: boolean }) {
 return <Link href="/" className={footer ? "logo brand-logo footer-logo" : "logo brand-logo"} aria-label="SàiHành — về trang chủ"><Image src={footer ? brandLogo : horizontalLogo} alt="SàiHành — Đi để cảm nhiều hơn" className="brand-logo-image" priority={!footer} sizes={footer ? "200px" : "(max-width: 600px) 136px, 190px"} /></Link>;
}
