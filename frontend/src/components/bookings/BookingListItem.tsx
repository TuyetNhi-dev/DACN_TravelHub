import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SERVICE_LABELS } from "@/lib/booking-rules";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { BookingSummary } from "@/types/booking";

export function BookingListItem({ booking, href }: { booking: BookingSummary; href: string }) {
  return (
    <li className="sh-panel sh-booking-card">
      <div>
        <div className="sh-booking-meta">
          <StatusBadge status={booking.itemStatus} />
          <span>{SERVICE_LABELS[booking.serviceType]}</span>
          <span>Mã {booking.code}</span>
        </div>
        <h2><Link href={href}>{booking.title}</Link></h2>
        {booking.subtitle && <p>{booking.subtitle}</p>}
        <p>Ngày sử dụng: {formatDate(booking.startDate)} · Đặt lúc {formatDateTime(booking.createdAt)}</p>
      </div>
      <div className="sh-booking-price">
        <strong>{formatCurrency(booking.total)}</strong>
        <Link className="btn btn-outline" href={href}>Xem chi tiết</Link>
      </div>
    </li>
  );
}
