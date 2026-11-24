import Link from "next/link";
import Image from "next/image";
import horizontalLogo from "../../../public/branding/saihanh-logo-horizontal.png";

/** The horizontal logo everywhere; in the footer it sits on a white chip because its navy text needs a light ground. */
export function Logo({ footer = false }: { footer?: boolean }) {
  return (
    <Link href="/" className={footer ? "logo brand-logo footer-logo" : "logo brand-logo"}
      aria-label="SàiHành — về trang chủ">
      <Image src={horizontalLogo} alt="SàiHành — Đi để cảm nhiều hơn" className="brand-logo-image"
        loading={footer ? "lazy" : "eager"} sizes={footer ? "180px" : "(max-width: 600px) 136px, 190px"} />
    </Link>
  );
}
