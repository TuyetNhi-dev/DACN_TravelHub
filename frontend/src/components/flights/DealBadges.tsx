import { DEAL_LOW_SEATS, seatsLeftLabel } from "@/lib/flight-deals";

/**
 * "Xác nhận ngay" plus the seats left for a deal; "Chờ xác nhận" for an ordinary partner quote. Only deals may
 * promise seats, because only they come from SàiHành's own allotment.
 */
export function ConfirmationBadges({ remainingSeats }: { remainingSeats: number | null }) {
  if (remainingSeats === null) return <span className="fd-pill is-pending">Chờ xác nhận</span>;
  return (
    <>
      <span className="fd-pill is-instant">Xác nhận ngay</span>
      <span className={remainingSeats <= DEAL_LOW_SEATS ? "fd-pill is-low" : "fd-pill"}>
        {seatsLeftLabel(remainingSeats)}
      </span>
    </>
  );
}

/** Replaces the "giá tham khảo, chờ xác nhận" notice for deals, which are confirmed on payment. */
export function DealNotice() {
  return (
    <div className="sh-notice fd-notice" role="note">
      <div>
        <strong>Vé deal · Xác nhận ngay</strong>
        <p>
          Vé lấy từ quỹ ghế SàiHành đã ký với hãng. Khi đặt, ghế được giữ cho bạn trong thời gian đếm ngược;
          thanh toán trong hạn là vé được xác nhận ngay, không phải chờ đối tác. Quá hạn, ghế được trả lại.
        </p>
      </div>
    </div>
  );
}
