"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ApiError } from "@/lib/api-client";
import { bookingHref, canBook, cartWarning } from "@/lib/cart-rules";
import { formatCurrency, formatDate } from "@/lib/format";
import { getTourImages } from "@/lib/media";
import type { CartItem } from "@/types/cart";
import { useCart } from "./CartProvider";

const CARD_IMAGE_SIZES = "(max-width: 767px) 100vw, 220px";

function travelersLabel(item: CartItem): string {
  const adults = `${item.adultCount} người lớn`;
  return item.childCount > 0 ? `${adults}, ${item.childCount} trẻ em` : adults;
}

/** One cart line: live price and seats, a clear warning when either changed, "Đặt ngay" and "Xóa". */
export function CartItemCard({ item }: { item: CartItem }) {
  const { remove } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const warning = cartWarning(item);
  const bookable = canBook(item.status);
  const tourHref = `/tours/${encodeURIComponent(item.tourId)}`;
  const cover = getTourImages({ id: item.tourId, destination: item.destination, title: item.tourTitle },
    item.imageUrl ? [{ url: item.imageUrl, alt: item.imageAlt }] : [])[0];

  async function removeItem() {
    setBusy(true);
    setError("");
    try {
      await remove(item);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Không thể xóa món này. Vui lòng thử lại.");
      setBusy(false);
    }
  }

  return (
    <li className={`cart-item${warning ? ` cart-item--${item.status}` : ""}`}>
      <Link href={tourHref} className="cart-item-media" tabIndex={-1} aria-hidden="true">
        {cover && <Image src={cover.src} alt="" fill sizes={CARD_IMAGE_SIZES} />}
      </Link>
      <div className="cart-item-body">
        <span className="cart-item-code">{item.tourCode}</span>
        <h2><Link href={tourHref}>{item.tourTitle}</Link></h2>
        <dl className="cart-item-facts">
          <div><dt>Khởi hành</dt>
            <dd>{formatDate(item.departureDate)} – {formatDate(item.returnDate)} · {item.departureFrom}</dd></div>
          <div><dt>Số khách</dt><dd>{travelersLabel(item)}</dd></div>
          <div><dt>Giá hiện tại</dt><dd>{formatCurrency(item.adultPrice)} / người lớn</dd></div>
          <div><dt>Chỗ còn</dt><dd>{item.availableSeats > 0 ? `${item.availableSeats} chỗ` : "Hết chỗ"}</dd></div>
        </dl>
        {warning && <p className="cart-item-warning"><Icon name="bell" size={16} />{warning}</p>}
        {error && <p className="sh-error" role="alert">{error}</p>}
      </div>
      <div className="cart-item-side">
        <p className="cart-item-price">
          <small>Tạm tính</small>
          <strong>{bookable ? formatCurrency(item.subtotal) : "—"}</strong>
        </p>
        {bookable
          ? <Link className="btn btn-primary" href={bookingHref(item)}>Đặt ngay</Link>
          : <button type="button" className="btn btn-primary" disabled>Đặt ngay</button>}
        <button type="button" className="cart-item-remove" disabled={busy} onClick={() => void removeItem()}
          aria-label={`Xóa ${item.tourTitle} khỏi giỏ`}>
          <Icon name="close" size={16} />{busy ? "Đang xóa…" : "Xóa"}
        </button>
      </div>
    </li>
  );
}
