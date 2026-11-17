"use client";

import { useState } from "react";
import { useDayPrices } from "@/hooks/useDayPrices";
import {
  FLEXIBLE_DAYS, addDays, compactPrice, dayWindow, isBookableMonth, lowestOf, monthOf, monthsCovering,
  weekdayLabel, weekdayName,
} from "@/lib/flight-calendar";
import { formatCurrency, formatDate, vietnamToday } from "@/lib/format";
import type { FlightRoute } from "@/types/flight";

const STRIP_SHIFT = FLEXIBLE_DAYS * 2 + 1;

interface PriceStripProps {
  route: FlightRoute;
  selected: string;
  onPick: (date: string) => void;
}

/** Seven days around the selected one with their lowest quote; the cheapest visible day is highlighted. */
export function PriceStrip({ route, selected, onPick }: PriceStripProps) {
  const today = vietnamToday();
  const [center, setCenter] = useState(selected);
  const days = dayWindow(center, today);
  const prices = useDayPrices(route, monthsCovering(days));
  const ready = prices.state.status === "ready" ? prices.state.data : null;
  const priceOf = (day: string) => ready?.get(day)?.lowestPrice ?? null;
  const lowest = lowestOf(days.map(priceOf));

  return (
    <div className="fp-strip" aria-label="Giá thấp nhất theo ngày">
      <button type="button" className="fp-strip-nav" disabled={days[0] <= today} aria-label="7 ngày trước"
        onClick={() => setCenter(addDays(days[0], FLEXIBLE_DAYS - STRIP_SHIFT))}>‹</button>
      <ol>
        {days.map(day => (
          <li key={day}>
            <DayButton day={day} price={priceOf(day)} loaded={ready !== null} selected={day === selected}
              cheapest={priceOf(day) !== null && priceOf(day) === lowest} onPick={onPick} />
          </li>
        ))}
      </ol>
      <button type="button" className="fp-strip-nav" aria-label="7 ngày sau"
        disabled={!isBookableMonth(monthOf(addDays(days[days.length - 1], STRIP_SHIFT)), today)}
        onClick={() => setCenter(addDays(days[0], FLEXIBLE_DAYS + STRIP_SHIFT))}>›</button>
      {prices.state.status === "error" && (
        <p className="fp-strip-error" role="alert">
          Chưa tải được lịch giá. <button type="button" onClick={prices.retry}>Thử lại</button>
        </p>
      )}
    </div>
  );
}

interface DayButtonProps {
  day: string;
  price: number | null;
  loaded: boolean;
  selected: boolean;
  cheapest: boolean;
  onPick: (date: string) => void;
}

function DayButton({ day, price, loaded, selected, cheapest, onPick }: DayButtonProps) {
  const priceText = price === null ? "chưa có giá" : "từ " + formatCurrency(price);
  const label = `${weekdayName(day)} ${formatDate(day)}: ${priceText}${cheapest ? ", rẻ nhất trong 7 ngày" : ""}`;
  return (
    <button type="button" aria-label={label} aria-current={selected ? "date" : undefined}
      className={cheapest ? "fp-day is-cheapest" : "fp-day"} onClick={() => onPick(day)}>
      <span>{weekdayLabel(day)} {formatDate(day).slice(0, 5)}</span>
      <strong>{!loaded ? "…" : price === null ? "—" : compactPrice(price)}</strong>
    </button>
  );
}
