import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PASSENGER_LABELS, SERVICE_LABELS, itemStatusMeta } from "@/lib/booking-rules";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { BookingDetail } from "@/types/booking";

interface BookingDetailViewProps {
  booking: BookingDetail;
  actions?: ReactNode;
}

export function BookingDetailView({ booking, actions }: BookingDetailViewProps) {
  const meta = itemStatusMeta(booking.itemStatus);
  return (
    <div className="sh-two-column">
      <div>
        <section className="sh-panel">
          <div className="sh-booking-meta">
            <StatusBadge status={booking.itemStatus} />
            <span>{SERVICE_LABELS[booking.serviceType]}</span>
            <span>Mã đơn <b>{booking.code}</b></span>
          </div>
          <h2>{booking.title}</h2>
          {booking.subtitle && <p>{booking.subtitle}</p>}
          <p className="sh-hotel-caption">{meta.hint}</p>
          <dl className="sh-facts">
            <div><dt>Ngày sử dụng</dt><dd>{formatDate(booking.startDate)}</dd></div>
            {booking.endDate && <div><dt>Ngày kết thúc</dt><dd>{formatDate(booking.endDate)}</dd></div>}
            <div><dt>Ngày đặt</dt><dd>{formatDateTime(booking.createdAt)}</dd></div>
            {booking.supplierConfirmationCode && (
              <div><dt>Mã xác nhận</dt><dd>{booking.supplierConfirmationCode}</dd></div>
            )}
          </dl>
        </section>
        {booking.customer && (
          <section className="sh-panel">
            <h2>Khách hàng</h2>
            <dl className="sh-facts">
              <div><dt>Họ tên</dt><dd>{booking.customer.fullName}</dd></div>
              <div><dt>Email</dt><dd>{booking.customer.email}</dd></div>
              <div><dt>Điện thoại</dt><dd>{booking.customer.phone ?? "Chưa cập nhật"}</dd></div>
            </dl>
          </section>
        )}
        <section className="sh-panel">
          <h2>Danh sách khách ({booking.passengers.length})</h2>
          <ol className="sh-passengers">
            {booking.passengers.map((passenger, index) => (
              <li key={`${passenger.fullName}-${index}`}>
                {passenger.fullName} · {PASSENGER_LABELS[passenger.passengerType]}
                {passenger.birthDate && ` · sinh ngày ${formatDate(passenger.birthDate)}`}
              </li>
            ))}
          </ol>
        </section>
        {booking.terms && (
          <section className="sh-panel"><h2>Điều kiện</h2><p>{booking.terms}</p></section>
        )}
      </div>
      <aside className="sh-panel sh-sticky" aria-label="Chi tiết giá">
        <h2>Chi tiết giá</h2>
        <dl className="sh-summary">
          {booking.priceLines.map(line => (
            <div key={line.label}>
              <dt>{line.label} <small>({line.quantity} × {formatCurrency(line.unitPrice)})</small></dt>
              <dd>{formatCurrency(line.amount)}</dd>
            </div>
          ))}
          {booking.discountTotal > 0 && (
            <div><dt>Giảm giá</dt><dd>-{formatCurrency(booking.discountTotal)}</dd></div>
          )}
          <div className="sh-total"><dt>Tổng cộng</dt><dd>{formatCurrency(booking.total)}</dd></div>
        </dl>
        {actions}
      </aside>
    </div>
  );
}
