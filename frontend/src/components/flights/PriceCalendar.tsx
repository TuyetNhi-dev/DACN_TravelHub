"use client";

import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useDayPrices } from "@/hooks/useDayPrices";
import {
  LOWEST_QUOTE_NOTE, compactPrice, isBookableMonth, monthGrid, monthLabel, monthOf, shiftMonth, weekdayName,
} from "@/lib/flight-calendar";
import { formatCurrency, formatDate, vietnamToday } from "@/lib/format";
import type { FlightDayPrice, FlightRoute } from "@/types/flight";

const WEEK_HEADINGS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

interface PriceCalendarProps {
  route: FlightRoute;
  selected: string;
  onPick: (date: string) => void;
}

/** A whole month of lowest quotes; the month's cheapest days (per the server) are highlighted. */
export function PriceCalendar({ route, selected, onPick }: PriceCalendarProps) {
  const today = vietnamToday();
  const [month, setMonth] = useState(monthOf(selected || today));
  const { state, retry } = useDayPrices(route, [month]);

  return (
    <section className="fp-calendar" aria-labelledby="fp-calendar-title">
      <header>
        <button type="button" aria-label="Tháng trước" disabled={!isBookableMonth(shiftMonth(month, -1), today)}
          onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
        <h3 id="fp-calendar-title" aria-live="polite">{monthLabel(month)}</h3>
        <button type="button" aria-label="Tháng sau" disabled={!isBookableMonth(shiftMonth(month, 1), today)}
          onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
      </header>
      {state.status === "loading" && <LoadingState label="Đang tải lịch giá…" />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === "ready" && (
        <MonthTable month={month} prices={state.data} today={today} selected={selected} onPick={onPick} />
      )}
      <p className="fp-note">
        {LOWEST_QUOTE_NOTE} Giá mỗi ngày là giá một khách, chưa gồm hành lý ký gửi.
      </p>
    </section>
  );
}

interface MonthTableProps {
  month: string;
  prices: Map<string, FlightDayPrice>;
  today: string;
  selected: string;
  onPick: (date: string) => void;
}

function MonthTable({ month, prices, today, selected, onPick }: MonthTableProps) {
  const hasQuotes = [...prices.values()].some(day => day.lowestPrice !== null);
  return (
    <>
      <table className="fp-month">
        <caption className="sr-only">Giá thấp nhất mỗi ngày, {monthLabel(month)}</caption>
        <thead><tr>{WEEK_HEADINGS.map(day => <th key={day} scope="col">{day}</th>)}</tr></thead>
        <tbody>
          {monthGrid(month).map(week => (
            <tr key={week.find(Boolean)}>
              {week.map((day, index) => (
                <td key={day ?? `pad-${index}`}>
                  {day && <CalendarDay day={day} price={prices.get(day)} past={day < today}
                    selected={day === selected} onPick={onPick} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!hasQuotes && <p className="fp-empty">Tháng này đối tác chưa có báo giá cho chặng đã chọn.</p>}
    </>
  );
}

interface CalendarDayProps {
  day: string;
  price: FlightDayPrice | undefined;
  past: boolean;
  selected: boolean;
  onPick: (date: string) => void;
}

function CalendarDay({ day, price, past, selected, onPick }: CalendarDayProps) {
  const lowest = price?.lowestPrice ?? null;
  const cheapest = price?.isCheapest === true;
  const text = lowest === null ? "chưa có giá" : "từ " + formatCurrency(lowest);
  const classes = ["fp-cell", cheapest && "is-cheapest", lowest === null && "is-empty"].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} disabled={past || lowest === null}
      aria-current={selected ? "date" : undefined}
      aria-label={`${weekdayName(day)} ${formatDate(day)}: ${text}${cheapest ? ", rẻ nhất tháng" : ""}`}
      onClick={() => onPick(day)}>
      <span>{Number(day.slice(8))}</span>
      <strong>{lowest === null ? "—" : compactPrice(lowest)}</strong>
    </button>
  );
}
