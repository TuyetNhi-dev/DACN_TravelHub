"use client";

import { useState } from "react";
import { MonthCalendar, useMonthsPerView } from "@/components/calendar/MonthCalendar";
import { addDays, monthLabel, monthOf, shiftMonth, weekdayName } from "@/lib/flight-calendar";
import { formatDate, vietnamToday } from "@/lib/format";
import { formatLunar, leapMonthOf, solarToLunar, yearCanChi } from "@/lib/lunar-calendar";
import { visibleMonths } from "@/lib/month-calendar";
import { holidaysBetween, holidaysOn, type VnHoliday } from "@/lib/vn-holidays";

const KIND_LABEL: Record<VnHoliday["kind"], string> = {
  official: "Nghỉ lễ",
  traditional: "Truyền thống",
  "lunar-day": "Mùng 1 / rằm",
};

export function LunarCalendarPage() {
  const today = vietnamToday();
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(monthOf(today));
  const count = useMonthsPerView();
  const months = visibleMonths(month, count);
  const from = `${months[0]}-01`;
  const to = addDays(`${shiftMonth(months[months.length - 1], 1)}-01`, -1);
  const named = holidaysBetween(from, to).filter(holiday => holiday.kind !== "lunar-day");

  return (
    <main id="main-content" className="lich-page">
      <div className="container">
        <header className="lich-head">
          <span className="kicker">LỊCH ÂM DƯƠNG</span>
          <h1>Lịch vạn niên</h1>
          <p>Xem ngày âm lịch, can chi, ngày nghỉ lễ và ngày truyền thống để lên kế hoạch cho chuyến đi.</p>
        </header>
        <div className="lich-layout">
          <section className="lich-card" aria-label="Lịch tháng">
            <MonthCalendar label="Lịch âm dương" today={today} month={month} onMonthChange={setMonth}
              selection={{ mode: "single", value: selected, onChange: setSelected }} />
            <p className="lich-note">
              Âm lịch tính theo múi giờ Việt Nam (UTC+7). Lịch nghỉ Tết và ngày nghỉ liền kề Quốc khánh do
              Thủ tướng công bố hằng năm, có thể có ngày nghỉ bù hoặc hoán đổi.
            </p>
          </section>
          <div className="lich-side">
            <DayDetails date={selected} />
            <section className="lich-card" aria-labelledby="lich-month-holidays">
              <h2 id="lich-month-holidays">Ngày lễ {months.map(monthLabel).join(" – ").toLowerCase()}</h2>
              {named.length ? (
                <ul className="lich-list">
                  {named.map(holiday => (
                    <li key={holiday.date + holiday.name} className={`is-${holiday.kind}`}>
                      <time dateTime={holiday.date}>{formatDate(holiday.date).slice(0, 5)}</time>
                      <span>
                        <b>{holiday.name}</b>
                        <small>
                          {KIND_LABEL[holiday.kind]} · âm lịch {formatLunar(holiday.lunar)}
                        </small>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className="lich-note">Không có ngày lễ trong thời gian này.</p>}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function DayDetails({ date }: { date: string }) {
  const lunar = solarToLunar(date);
  const holidays = holidaysOn(date);
  const leap = lunar ? leapMonthOf(lunar.year) : null;
  return (
    <section className="lich-card" aria-labelledby="lich-day-title" aria-live="polite">
      <h2 id="lich-day-title">{weekdayName(date)}, {formatDate(date)}</h2>
      {lunar && (
        <>
          <div className="lich-day-big">
            <strong>{lunar.day}</strong>
            <span>tháng {lunar.month}{lunar.leap ? " nhuận" : ""} âm lịch</span>
          </div>
          <dl className="lich-facts">
            <dt>Năm âm lịch</dt>
            <dd>{yearCanChi(lunar.year)} ({lunar.year}){leap ? ` · nhuận tháng ${leap}` : ""}</dd>
            {holidays.length > 0 && (
              <>
                <dt>Ngày lễ</dt>
                {holidays.map(holiday => (
                  <dd key={holiday.name}>
                    {holiday.name} <small>({KIND_LABEL[holiday.kind].toLowerCase()})</small>
                    {holiday.note && <small className="lich-note"> {holiday.note}</small>}
                  </dd>
                ))}
              </>
            )}
          </dl>
        </>
      )}
    </section>
  );
}
