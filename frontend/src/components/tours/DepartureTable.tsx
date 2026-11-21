import { formatCurrency, formatDate } from "@/lib/format";
import { seatLabel } from "@/lib/tour-display";
import type { TourDeparture } from "@/types/tour";

// Header cells and the phone card labels (td[data-label]) share these names.
const COLUMNS = ["Ngày đi", "Ngày về", "Điểm đón", "Người lớn", "Trẻ em", "Tình trạng"] as const;
const [DEPART, RETURN, PICKUP, ADULT, CHILD, SEATS] = COLUMNS;

export function DepartureTable({ departures }: { departures: TourDeparture[] }) {
  if (departures.length === 0) return <p>Chưa có lịch khởi hành sắp tới.</p>;
  return (
    <div className="departure-table-wrap">
      <table className="departure-table sh-table--cards">
        <caption>Giá theo từng lịch khởi hành, số chỗ cập nhật tại thời điểm tải trang</caption>
        <thead>
          <tr>{COLUMNS.map(column => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {departures.map(departure => (
            <tr key={departure.id}>
              <td data-label={DEPART}>{formatDate(departure.departureDate)}</td>
              <td data-label={RETURN}>{formatDate(departure.returnDate)}</td>
              <td data-label={PICKUP}>{departure.departureFrom}</td>
              <td data-label={ADULT}>{formatCurrency(departure.adultPrice)}</td>
              <td data-label={CHILD}>{formatCurrency(departure.childPrice ?? departure.adultPrice)}</td>
              <td data-label={SEATS}>
                {departure.isBookable ? seatLabel(departure) : `Không nhận đặt · ${seatLabel(departure)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
