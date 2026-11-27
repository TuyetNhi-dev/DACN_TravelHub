import { formatDate } from "@/lib/format";
import { breakStrip, type HolidayBreak, type StripDayKind } from "@/lib/holiday-breaks";

/** Spoken and tooltip names; the strip also differs by border style, so colour is never the only cue. */
export const STRIP_LABELS: Record<StripDayKind, string> = {
  holiday: "Ngày lễ",
  weekend: "Cuối tuần",
  leave: "Xin nghỉ thêm",
};

export function BreakDayStrip({ item }: { item: HolidayBreak }) {
  return (
    <ol className="break-strip" aria-label="Các ngày của đợt nghỉ">
      {breakStrip(item).map(day => {
        const label = day.inBreak || day.kind === "leave" ? STRIP_LABELS[day.kind] : "Cuối tuần, cần nghỉ thêm";
        return (
          <li key={day.date} className={`break-day is-${day.kind}${day.inBreak ? "" : " is-extra"}`}
            title={`${formatDate(day.date)}: ${label}`}>
            <span className="break-day-weekday">{day.weekday}</span>
            <span className="break-day-number">{day.day}</span>
            <span className="sr-only">{formatDate(day.date)}, {label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Key to the strip, shown once above the list. */
export function BreakStripLegend() {
  return (
    <ul className="break-legend" aria-label="Chú thích dải ngày">
      {(Object.keys(STRIP_LABELS) as StripDayKind[]).map(kind => (
        <li key={kind}><span className={`break-legend-mark is-${kind}`} aria-hidden="true" />{STRIP_LABELS[kind]}</li>
      ))}
    </ul>
  );
}
