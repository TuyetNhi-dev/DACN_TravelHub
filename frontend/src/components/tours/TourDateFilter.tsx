"use client";

import { MonthCalendar, type DayInfo } from "@/components/calendar/MonthCalendar";
import { monthOf, shiftMonth } from "@/lib/flight-calendar";
import { vietnamToday } from "@/lib/format";
import { MAX_CALENDAR_MONTHS_AHEAD } from "@/lib/tour-search";

/** Day counts of the visible month and how to page it; filled by the server (/tours) or the page (a collection). */
export interface DateFilterData {
  month: string;
  onMonthChange: (month: string) => void;
  /** Tours per "yyyy-mm-dd" of the month; null while loading. */
  counts: ReadonlyMap<string, number> | null;
  failed: boolean;
}

interface TourDateFilterProps extends DateFilterData {
  value: string;
  onChange: (date: string) => void;
}

/**
 * "Ngày khởi hành" as a month calendar: each day shows how many tours (under the other filters) leave that day,
 * days without any cannot be picked, and picking the chosen day again clears the filter.
 */
export function TourDateFilter({ value, onChange, month, onMonthChange, counts, failed }: TourDateFilterProps) {
  const today = vietnamToday();

  function dayInfo(date: string): DayInfo {
    // Without counts (still loading, or failed) any future day stays pickable so the filter keeps working.
    if (!counts) return { disabled: date <= today };
    const tours = counts.get(date) ?? 0;
    if (tours === 0) return { disabled: true };
    return {
      highlighted: true, description: `${tours} tour khởi hành`,
      extra: <span className="mc-extra tour-date-count">{tours} tour</span>,
    };
  }

  return (
    <div className="listing-field tour-date-filter">
      <span>Ngày khởi hành</span>
      <MonthCalendar label="Chọn ngày khởi hành để lọc tour" today={today} monthsPerView={1} month={month}
        onMonthChange={onMonthChange} minMonth={monthOf(today)}
        maxMonth={shiftMonth(monthOf(today), MAX_CALENDAR_MONTHS_AHEAD)} dayInfo={dayInfo}
        selection={{ mode: "single", value: value || null, onChange: date => onChange(date === value ? "" : date) }} />
      <p className="tour-date-hint" role="status">
        {failed ? "Chưa tải được số tour theo ngày; bạn vẫn chọn được ngày để lọc."
          : counts ? "Chọn ngày để lọc tour khởi hành; bấm lại ngày đó để bỏ chọn."
            : "Đang đếm tour theo ngày…"}
      </p>
    </div>
  );
}
