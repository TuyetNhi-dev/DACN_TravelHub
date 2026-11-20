"use client";

import {
  useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode,
} from "react";
import { monthLabel, monthOf, shiftMonth, weekdayName } from "@/lib/flight-calendar";
import { formatDate, vietnamToday } from "@/lib/format";
import { formatLunar } from "@/lib/lunar-calendar";
import {
  WEEK_HEADINGS, calendarMonth, monthShowing, moveDate, nightsOf, pickRange, rangePosition, visibleMonths,
  type CalendarCell, type DateRange, type RangePosition,
} from "@/lib/month-calendar";

export type CalendarSelection =
  | { mode: "none" }
  | { mode: "single"; value: string | null; onChange: (date: string) => void }
  | { mode: "range"; value: DateRange; onChange: (range: DateRange) => void };

/** Per-day additions from the page using the calendar (e.g. tour price and seats). */
export interface DayInfo {
  disabled?: boolean;
  /** Emphasised day, e.g. a day with a bookable departure. */
  highlighted?: boolean;
  /** Faded day, e.g. a sold-out departure. */
  muted?: boolean;
  extra?: ReactNode;
  /** Appended to the day's aria-label. */
  description?: string;
}

interface MonthCalendarProps {
  label: string;
  selection: CalendarSelection;
  today?: string;
  /** Controlled first visible month ("yyyy-mm"); omit to let the calendar manage it. */
  month?: string;
  onMonthChange?: (month: string) => void;
  defaultMonth?: string;
  minMonth?: string;
  maxMonth?: string;
  dayInfo?: (date: string) => DayInfo;
  /** Extra legend items rendered after the holiday legend. */
  legend?: ReactNode;
  /** Fixed number of months; by default two on wide screens and one on phones. */
  monthsPerView?: number;
  /**
   * Cell size. Every cell of a variant has the same height so rows line up across months:
   * "compact" (home teaser), "default", "details" (cells with price/seats from `dayInfo.extra`).
   */
  variant?: "compact" | "default" | "details";
}

const WIDE_QUERY = "(min-width: 900px)";

function subscribeWide(onChange: () => void) {
  const media = window.matchMedia(WIDE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Months shown side by side: two on wide screens, one on phones (and during server rendering). */
export function useMonthsPerView(): number {
  return useSyncExternalStore(subscribeWide, () => (window.matchMedia(WIDE_QUERY).matches ? 2 : 1), () => 1);
}

function selectedStart(selection: CalendarSelection): string | null {
  if (selection.mode === "single") return selection.value;
  if (selection.mode === "range") return selection.value.start;
  return null;
}

/** Visible months, month paging and roving keyboard focus (WAI-ARIA date-picker grid). */
function useCalendarNavigation(props: MonthCalendarProps, today: string) {
  const responsiveCount = useMonthsPerView();
  const count = props.monthsPerView ?? responsiveCount;
  const anchor = selectedStart(props.selection);
  const [innerMonth, setInnerMonth] = useState(() => props.defaultMonth ?? monthOf(anchor ?? today));
  const first = props.month ?? innerMonth;
  const months = visibleMonths(first, count);
  const [focused, setFocused] = useState<string | null>(null);
  const focusPending = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // A selection made outside the calendar (e.g. the departure dropdown) scrolls it into view.
  const [seenAnchor, setSeenAnchor] = useState(anchor);
  if (anchor !== seenAnchor) {
    setSeenAnchor(anchor);
    if (anchor && props.month === undefined) setInnerMonth(monthShowing(anchor, first, count));
  }

  useEffect(() => {
    if (!focusPending.current || !focused) return;
    focusPending.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
  }, [focused, first]);

  const inBounds = (month: string) =>
    (!props.minMonth || month >= props.minMonth) && (!props.maxMonth || month <= props.maxMonth);

  function changeMonth(next: string) {
    if (props.month === undefined) setInnerMonth(next);
    props.onMonthChange?.(next);
  }

  function handleKey(date: string, event: KeyboardEvent<HTMLButtonElement>) {
    const next = moveDate(date, event.key);
    if (!next) return;
    event.preventDefault();
    if (!inBounds(monthOf(next))) return;
    const nextFirst = monthShowing(next, first, count);
    if (nextFirst !== first) changeMonth(nextFirst);
    focusPending.current = true;
    setFocused(next);
  }

  const isVisible = (date: string | null): date is string => !!date && months.includes(monthOf(date));
  const tabStop = [focused, anchor, today].find(isVisible) ?? `${first}-01`;
  return { first, months, gridRef, tabStop, inBounds, changeMonth, handleKey, setFocused };
}

export function MonthCalendar(props: MonthCalendarProps) {
  const { label, selection, dayInfo, legend } = props;
  const today = props.today ?? vietnamToday();
  const { first, months, gridRef, tabStop, inBounds, changeMonth, handleKey, setFocused } =
    useCalendarNavigation(props, today);
  const last = months[months.length - 1];

  function handlePick(date: string, disabled: boolean) {
    setFocused(date);
    if (disabled) return;
    if (selection.mode === "single") selection.onChange(date);
    if (selection.mode === "range") selection.onChange(pickRange(selection.value, date));
  }

  return (
    <div className={`mc mc--${props.variant ?? "default"}`} role="group" aria-label={label}>
      <div className="mc-nav">
        <button type="button" aria-label="Tháng trước" disabled={!inBounds(shiftMonth(first, -1))}
          onClick={() => changeMonth(shiftMonth(first, -1))}>‹</button>
        <p aria-live="polite">{months.map(monthLabel).join(" – ")}</p>
        <button type="button" aria-label="Tháng sau" disabled={!inBounds(shiftMonth(last, 1))}
          onClick={() => changeMonth(shiftMonth(first, 1))}>›</button>
      </div>
      <div className="mc-months" ref={gridRef}>
        {months.map(month => (
          <MonthTable key={month} month={month} today={today} selection={selection} dayInfo={dayInfo}
            tabStop={tabStop} onPick={handlePick} onKey={handleKey} onFocus={setFocused} />
        ))}
      </div>
      {selection.mode === "range" && <RangeSummary range={selection.value} />}
      <ul className="mc-legend" aria-label="Chú thích">
        <li><i className="is-official" aria-hidden="true" />Ngày nghỉ lễ</li>
        <li><i className="is-traditional" aria-hidden="true" />Ngày truyền thống</li>
        <li><i className="is-today" aria-hidden="true" />Hôm nay</li>
        {legend}
      </ul>
    </div>
  );
}

function RangeSummary({ range }: { range: DateRange }) {
  const nights = nightsOf(range);
  let text = "Chọn ngày nhận phòng";
  if (range.start && nights !== null) text = `${formatDate(range.start)} → ${formatDate(range.end)} · ${nights} đêm`;
  else if (range.start) text = `Nhận phòng ${formatDate(range.start)} · chọn ngày trả phòng`;
  return <p className="mc-nights" aria-live="polite">{text}</p>;
}

interface DayHandlers {
  selection: CalendarSelection;
  tabStop: string;
  onPick: (date: string, disabled: boolean) => void;
  onKey: (date: string, event: KeyboardEvent<HTMLButtonElement>) => void;
  onFocus: (date: string) => void;
}

interface MonthTableProps extends DayHandlers {
  month: string;
  today: string;
  dayInfo?: (date: string) => DayInfo;
}

function MonthTable({ month, today, dayInfo, ...handlers }: MonthTableProps) {
  return (
    <table className="mc-month">
      <caption>{monthLabel(month)}</caption>
      <thead>
        <tr>
          {WEEK_HEADINGS.map(day => <th key={day} scope="col" className={day === "CN" ? "is-sunday" : undefined}>{day}</th>)}
        </tr>
      </thead>
      <tbody>
        {calendarMonth(month, today).map(week => (
          <tr key={week.find(Boolean)?.date}>
            {week.map((cell, column) => (
              <td key={cell?.date ?? `pad-${column}`}>
                {cell && <DayButton cell={cell} column={column} info={dayInfo?.(cell.date) ?? {}} {...handlers} />}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface DayState {
  /** Selection is possible in this calendar but not on this day. */
  blocked: boolean;
  selected: boolean;
  range: RangePosition;
}

function dayState(date: string, selection: CalendarSelection, info: DayInfo): DayState {
  if (selection.mode === "none") return { blocked: false, selected: false, range: null };
  if (selection.mode === "single") {
    return { blocked: info.disabled === true, selected: selection.value === date, range: null };
  }
  const range = rangePosition(date, selection.value);
  return { blocked: info.disabled === true, selected: range === "start" || range === "end", range };
}

function dayClassName(cell: CalendarCell, state: DayState, info: DayInfo): string {
  const flags: [string, boolean][] = [
    ["is-sunday", cell.isSunday],
    ["is-today", cell.isToday],
    ["is-selected", state.selected],
    ["is-in-range", state.range === "middle"],
    ["is-highlighted", info.highlighted === true],
    ["is-muted", info.muted === true],
    ["is-disabled", state.blocked],
  ];
  const holiday = cell.labelled[0];
  return ["mc-day", ...flags.filter(([, on]) => on).map(([name]) => name), holiday ? `has-${holiday.kind}` : ""]
    .filter(Boolean).join(" ");
}

function dayAriaLabel(cell: CalendarCell, state: DayState, info: DayInfo): string {
  const holidays = cell.labelled.map(item => (item.kind === "official" ? `${item.name} (nghỉ lễ)` : item.name));
  const parts = [`${weekdayName(cell.date)} ${formatDate(cell.date)}`];
  if (cell.lunar) parts.push(`âm lịch ${formatLunar(cell.lunar)}`);
  parts.push(...holidays);
  if (cell.isToday) parts.push("hôm nay");
  if (info.description) parts.push(info.description);
  if (state.blocked) parts.push("không chọn được");
  return parts.join(", ");
}

interface DayButtonProps extends DayHandlers {
  cell: CalendarCell;
  column: number;
  info: DayInfo;
}

function DayButton({ cell, column, info, selection, tabStop, onPick, onKey, onFocus }: DayButtonProps) {
  const state = dayState(cell.date, selection, info);
  const selectable = selection.mode !== "none";
  const holiday = cell.labelled[0];
  return (
    <button type="button" className={dayClassName(cell, state, info)} data-date={cell.date} data-col={column}
      tabIndex={cell.date === tabStop ? 0 : -1} aria-label={dayAriaLabel(cell, state, info)}
      aria-pressed={selectable ? state.selected : undefined} aria-disabled={state.blocked || undefined}
      aria-current={cell.isToday ? "date" : undefined}
      onClick={() => onPick(cell.date, !selectable || state.blocked)}
      onKeyDown={event => onKey(cell.date, event)} onFocus={() => onFocus(cell.date)}>
      <span className="mc-solar">{cell.day}</span>
      <span className={cell.lunar?.day === 1 ? "mc-lunar is-first" : "mc-lunar"}>{cell.lunarLabel}</span>
      {/* Only a colour dot fits in a cell; the full name is in the tooltip, the aria-label and the page's list. */}
      {holiday && <span className={`mc-dot is-${holiday.kind}`} aria-hidden="true" />}
      {info.extra}
      {holiday && (
        <span className="mc-tip" aria-hidden="true">
          {cell.labelled.map(item => <span key={item.name} className={`is-${item.kind}`}>{item.name}</span>)}
        </span>
      )}
    </button>
  );
}
