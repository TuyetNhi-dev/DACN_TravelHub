import { departureChips, shortDate } from "@/lib/destination-region";
import { formatDate } from "@/lib/format";

const MAX_CHIPS = 4;

/** Next open departure dates as chips. Not links: the whole tour card is already one link. */
export function DepartureChips({ dates }: { dates: string[] }) {
  const { shown, hidden } = departureChips(dates, MAX_CHIPS);
  return (
    <ul className="tour-chips" aria-label="Ngày khởi hành gần nhất">
      {shown.map(date => (
        <li key={date}><time dateTime={date} title={formatDate(date)}>{shortDate(date)}</time></li>
      ))}
      {hidden > 0 && (
        <li className="tour-chips-more"><span aria-hidden="true">+{hidden}</span>
          <span className="sr-only">và {hidden} ngày khác</span></li>
      )}
    </ul>
  );
}
