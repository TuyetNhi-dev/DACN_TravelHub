/** Calendar-leaf mark for the first day of a break: month on the tab, day number below. */
export function DateLeaf({ date }: { date: string }) {
  return (
    <span className="date-leaf" aria-hidden="true">
      <span className="date-leaf-month">Th {Number(date.slice(5, 7))}</span>
      <span className="date-leaf-day">{date.slice(8)}</span>
    </span>
  );
}
