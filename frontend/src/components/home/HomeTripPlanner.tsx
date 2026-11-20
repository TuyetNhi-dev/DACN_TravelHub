"use client";

import Link from "next/link";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { weekdayName } from "@/lib/flight-calendar";
import { formatDate, vietnamToday } from "@/lib/format";
import { formatLunar } from "@/lib/lunar-calendar";
import { upcomingHolidays, type UpcomingHoliday } from "@/lib/vn-holidays";

const UPCOMING_COUNT = 3;

function daysLeftLabel(daysLeft: number): string {
  if (daysLeft === 0) return "Hôm nay";
  if (daysLeft === 1) return "Ngày mai";
  return `Còn ${daysLeft} ngày`;
}

/** Home teaser under the hero search: this month's lunar calendar and the next holidays to plan a trip around. */
export function HomeTripPlanner() {
  const today = vietnamToday();
  const upcoming = upcomingHolidays(today, UPCOMING_COUNT);
  return (
    <section className="container home-planner" aria-labelledby="planner-title">
      <div className="home-planner-card">
        <div className="home-planner-calendar">
          <MonthCalendar label="Lịch âm dương tháng này" today={today} selection={{ mode: "none" }}
            monthsPerView={1} variant="compact" />
          <ButtonLink href="/lich" variant="outline" size="sm">Xem lịch đầy đủ</ButtonLink>
        </div>
        <div className="home-planner-side">
          <div>
            <span className="ui-eyebrow">Lịch âm dương</span>
            <h2 id="planner-title">Lên lịch cho chuyến đi</h2>
          </div>
          <p>Những dịp lễ sắp tới, tính từ hôm nay theo giờ Việt Nam. Đặt tour sớm để giữ chỗ trước mùa cao điểm.</p>
          {upcoming.length > 0 && (
            <ol className="home-holidays">
              {upcoming.map(item => <HolidayRow key={item.holiday.date + item.holiday.name} item={item} />)}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

function HolidayRow({ item: { holiday, daysLeft } }: { item: UpcomingHoliday }) {
  const [, month, day] = holiday.date.split("-");
  return (
    <li className={`home-holiday is-${holiday.kind}`}>
      <time className="home-holiday-date" dateTime={holiday.date}>
        <b>{Number(day)}</b><small>Th{Number(month)}</small>
      </time>
      <div className="home-holiday-info">
        <h3>{holiday.name}</h3>
        <p>{weekdayName(holiday.date)}, {formatDate(holiday.date)} · âm lịch {formatLunar(holiday.lunar)}</p>
        <span className="home-holiday-kind">{holiday.kind === "official" ? "Nghỉ lễ" : "Truyền thống"}</span>
      </div>
      <div className="home-holiday-actions">
        <span className="home-holiday-left">{daysLeftLabel(daysLeft)}</span>
        {/* Not filtered by occasion yet: /tours does not support a date range or occasion filter. */}
        <Link className="ui-view-all" href="/tours" aria-label={`Xem tour dịp ${holiday.name}`}>
          Xem tour dịp này <Icon name="arrow" size={16} />
        </Link>
      </div>
    </li>
  );
}
