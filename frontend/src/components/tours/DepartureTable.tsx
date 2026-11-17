import { formatCurrency, formatDate } from "@/lib/format";
import { seatLabel } from "@/lib/tour-display";
import type { TourDeparture } from "@/types/tour";

export function DepartureTable({ departures }: { departures: TourDeparture[] }) {
  if (departures.length === 0) return <p>Chưa có lịch khởi hành sắp tới.</p>;
  return (
    <div className="departure-table-wrap">
      <table className="departure-table">
        <caption>Giá theo từng lịch khởi hành, số chỗ cập nhật tại thời điểm tải trang</caption>
        <thead>
          <tr><th>Ngày đi</th><th>Ngày về</th><th>Điểm đón</th><th>Người lớn</th><th>Trẻ em</th><th>Tình trạng</th></tr>
        </thead>
        <tbody>
          {departures.map(departure => (
            <tr key={departure.id}>
              <td>{formatDate(departure.departureDate)}</td>
              <td>{formatDate(departure.returnDate)}</td>
              <td>{departure.departureFrom}</td>
              <td>{formatCurrency(departure.adultPrice)}</td>
              <td>{formatCurrency(departure.childPrice ?? departure.adultPrice)}</td>
              <td>{departure.isBookable ? seatLabel(departure) : `Không nhận đặt · ${seatLabel(departure)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
