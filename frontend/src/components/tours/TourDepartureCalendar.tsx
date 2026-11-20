"use client";

import { useMemo } from "react";
import { MonthCalendar, type DayInfo } from "@/components/calendar/MonthCalendar";
import { departureDays, initialDepartureMonth } from "@/lib/departure-calendar";
import { compactPrice, monthOf } from "@/lib/flight-calendar";
import { formatCurrency, vietnamToday } from "@/lib/format";
import type { TourDeparture } from "@/types/tour";

interface TourDepartureCalendarProps {
  departures: TourDeparture[];
  /** Currently chosen departure, shared with the booking panel's dropdown. */
  selectedId: string | null;
  onSelect: (departureId: string) => void;
}

/** Month calendar of departures: bookable days show price and seats; other days cannot be picked. */
export function TourDepartureCalendar({ departures, selectedId, onSelect }: TourDepartureCalendarProps) {
  const today = vietnamToday();
  const days = useMemo(() => departureDays(departures), [departures]);
  const selectedDate = departures.find(item => item.id === selectedId)?.departureDate ?? null;
  const lastDate = [...days.keys()].at(-1);
  // Navigation stops at the month of the last departure (never before the current month).
  const maxMonth = lastDate ? [monthOf(today), monthOf(lastDate)].sort()[1] : undefined;

  function dayInfo(date: string): DayInfo {
    const day = days.get(date);
    if (!day) return { disabled: true };
    if (!day.pick) {
      return {
        disabled: true, muted: true, description: "hết chỗ hoặc ngừng nhận khách",
        extra: <span className="mc-extra"><small>Hết chỗ</small></span>,
      };
    }
    const multiple = day.departures.filter(item => item.isBookable).length > 1;
    return {
      highlighted: true,
      description: `có lịch khởi hành, giá từ ${formatCurrency(day.lowestPrice)}, còn ${day.seats} chỗ`
        + (multiple ? ", nhiều điểm đón" : ""),
      extra: (
        <span className="mc-extra">
          {compactPrice(day.lowestPrice)}
          <small>Còn {day.seats}</small>
        </span>
      ),
    };
  }

  return (
    <div className="tour-calendar">
      <MonthCalendar label="Chọn ngày khởi hành" today={today} variant="details"
        defaultMonth={initialDepartureMonth(days, selectedDate, today)}
        minMonth={monthOf(today)} maxMonth={maxMonth}
        selection={{
          mode: "single", value: selectedDate,
          onChange: date => { const pick = days.get(date)?.pick; if (pick) onSelect(pick.id); },
        }}
        dayInfo={dayInfo}
        legend={<>
          <li><i className="is-departure" aria-hidden="true" />Có lịch khởi hành</li>
          <li><i className="is-soldout" aria-hidden="true" />Hết chỗ</li>
        </>} />
      <p className="tour-calendar-hint">
        Giá người lớn thấp nhất trong ngày; số chỗ cập nhật tại thời điểm tải trang. Chọn ngày để điền vào khung đặt tour.
      </p>
    </div>
  );
}
