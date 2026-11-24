import { Icon } from "@/components/ui/Icon";
import { boardPercent } from "@/lib/check-in";
import { formatDate } from "@/lib/format";
import type { CheckInBoard } from "@/types/ticket";

/** Departure, whether check-in is open, and how much of the group has boarded. */
export function CheckInSummary({ board }: { board: CheckInBoard }) {
  const { departure } = board;
  const percent = boardPercent(board);
  const open = board.closedReason === null;
  return (
    <section className="adm-panel checkin-summary" aria-labelledby="checkin-departure">
      <div className="checkin-summary-head">
        <div>
          <p className="checkin-tour-code">{departure.tourCode}</p>
          <h2 id="checkin-departure">{departure.tourTitle}</h2>
          <p className="adm-note">
            Khởi hành {formatDate(departure.departureDate)} từ {departure.departureFrom},
            {" "}về {formatDate(departure.returnDate)} · {departure.branchName}
          </p>
        </div>
        <span className={open ? "checkin-window is-open" : "checkin-window"}>
          <Icon name={open ? "check" : "clock"} size={14} />{open ? "Đang mở check-in" : "Chưa mở check-in"}
        </span>
      </div>
      <div className="checkin-progress">
        <div className="checkin-progress-label">
          <span><strong>{board.checkedInCount}</strong> / {board.passengerCount} khách đã check-in</span>
          <span>{percent}%</span>
        </div>
        <div className="checkin-progress-track" role="progressbar" aria-label="Tiến độ check-in"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span style={{ transform: `scaleX(${percent / 100})` }} />
        </div>
        <p className="adm-note">
          {board.bookings.length} đơn đã thanh toán · còn {board.passengerCount - board.checkedInCount} khách chờ
        </p>
      </div>
      {board.closedReason && <p className="checkin-callout" role="status">{board.closedReason}</p>}
      {!board.canScan && (
        <p className="checkin-callout">Máy chủ chưa cấu hình khóa vé điện tử: tạm thời chỉ check-in theo danh sách.</p>
      )}
    </section>
  );
}
