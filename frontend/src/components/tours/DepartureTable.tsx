import { formatCurrency, formatDate } from "@/lib/format";
import { seatLabel, tripHolidayNames } from "@/lib/tour-display";
import type { TourDeparture } from "@/types/tour";

// Header cells and the phone card labels (td[data-label]) share these names.
const COLUMNS = ["Ngày đi", "Ngày về", "Điểm đón", "Người lớn", "Trẻ em", "Tình trạng", "Đặt"] as const;
const [DEPART, RETURN, PICKUP, ADULT, CHILD, SEATS, PICK] = COLUMNS;

interface DepartureTableProps {
  departures: TourDeparture[];
  /** The departure filled in the booking panel; its row is marked. */
  selectedId: string | null;
  onSelect: (departureId: string) => void;
}

/** Every departure with its prices; "Chọn" fills the booking panel with that departure. */
export function DepartureTable({ departures, selectedId, onSelect }: DepartureTableProps) {
  if (departures.length === 0) return <p>Chưa có lịch khởi hành sắp tới.</p>;
  return (
    <div className="departure-table-wrap">
      <table className="departure-table sh-table--cards">
        <caption>
          Giá theo từng lịch khởi hành, số chỗ cập nhật tại thời điểm tải trang. Bấm &quot;Chọn&quot; để điền lịch
          vào khung đặt tour.
        </caption>
        <thead>
          <tr>{COLUMNS.map(column => <th key={column} scope="col">{column}</th>)}</tr>
        </thead>
        <tbody>
          {departures.map(departure => (
            <DepartureRow key={departure.id} departure={departure} selected={departure.id === selectedId}
              onSelect={onSelect} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DepartureRowProps {
  departure: TourDeparture;
  selected: boolean;
  onSelect: (departureId: string) => void;
}

function DepartureRow({ departure, selected, onSelect }: DepartureRowProps) {
  const holidays = tripHolidayNames(departure);
  const date = formatDate(departure.departureDate);
  return (
    <tr className={selected ? "is-selected" : undefined}>
      <td data-label={DEPART}>
        {date}
        {holidays.length > 0 && <span className="departure-holiday">Dịp {holidays.join(", ")}</span>}
      </td>
      <td data-label={RETURN}>{formatDate(departure.returnDate)}</td>
      <td data-label={PICKUP}>{departure.departureFrom}</td>
      <td data-label={ADULT}>{formatCurrency(departure.adultPrice)}</td>
      <td data-label={CHILD}>{formatCurrency(departure.childPrice ?? departure.adultPrice)}</td>
      <td data-label={SEATS}>
        {departure.isBookable ? seatLabel(departure) : `Không nhận đặt · ${seatLabel(departure)}`}
      </td>
      <td data-label={PICK}>
        {departure.isBookable && (
          <button type="button" className={`btn ${selected ? "btn-primary" : "btn-outline"} departure-pick`}
            aria-pressed={selected} aria-label={`Chọn lịch khởi hành ${date} từ ${departure.departureFrom}`}
            onClick={() => onSelect(departure.id)}>
            {selected ? "Đã chọn" : "Chọn"}
          </button>
        )}
      </td>
    </tr>
  );
}
