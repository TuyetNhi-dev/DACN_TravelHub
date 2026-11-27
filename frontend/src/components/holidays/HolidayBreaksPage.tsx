"use client";

import { useState } from "react";
import { useDeparture } from "@/components/departure/DepartureProvider";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useHolidayBreaks } from "@/hooks/useHolidayBreaks";
import { useResource, type Resource } from "@/hooks/useResource";
import { regions, validRegion, type Region } from "@/lib/departure-region";
import {
  BREAK_HORIZON_MONTHS, breakAnchor, startsInLabel, summarizeBreaks, type HolidayBreak,
} from "@/lib/holiday-breaks";
import { getTours } from "@/services/tours";
import type { TourSummary } from "@/types/tour";
import { BreakStripLegend } from "./BreakDayStrip";
import { HolidayBreakCard } from "./HolidayBreakCard";

export function HolidayBreaksPage() {
  const { region: siteRegion } = useDeparture();
  // Starts from the site-wide departure choice; changing it here only filters this page.
  const [picked, setPicked] = useState<Region | null>(null);
  const region = picked ?? siteRegion;
  const { state, retry } = useResource("ky-nghi:tours", getTours);
  const { today, breaks, tours } = useHolidayBreaks(state, region);

  return (
    <main id="main-content" className="breaks-page">
      <div className="container">
        <header className="breaks-head">
          <span className="ui-eyebrow">Kỳ nghỉ thông minh</span>
          <h1>Kỳ nghỉ lễ {BREAK_HORIZON_MONTHS} tháng tới</h1>
          <p>
            Ngày lễ theo luật cộng thứ Bảy, Chủ nhật liền kề, kèm tour có ngày đi và ngày về nằm trọn trong đợt
            nghỉ.
          </p>
        </header>
        {today && breaks && <BreaksSummaryBar today={today} breaks={breaks} />}
        <div className="breaks-toolbar">
          <RegionSelect value={region ?? "all"} onChange={setPicked} />
          <BreakStripLegend />
        </div>
        <p className="breaks-disclaimer">
          <Icon name="alert" size={18} />
          <span>
            <strong>Lịch ước tính, không phải lịch nghỉ chính thức.</strong> Ngày nghỉ bù, hoán đổi ngày làm việc và
            lịch nghỉ Tết, Quốc khánh do Thủ tướng công bố hằng năm. Giá theo từng ngày khởi hành xem ở trang tour.
          </span>
        </p>
        {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
        <BreakList today={today} breaks={breaks} tours={tours} />
      </div>
    </main>
  );
}

function BreaksSummaryBar({ today, breaks }: { today: string; breaks: HolidayBreak[] }) {
  const summary = summarizeBreaks(breaks);
  if (!summary) return null;
  const { next, longest, longestWithLeave } = summary;
  return (
    <dl className="breaks-summary">
      <div><dt>Đợt nghỉ sắp tới</dt><dd>{breaks.length} đợt</dd></div>
      <div>
        <dt>Gần nhất</dt>
        <dd><a href={`#${breakAnchor(next)}`}>{next.holidayNames[0]}</a><small>{startsInLabel(today, next)}</small></dd>
      </div>
      <div>
        <dt>Dài nhất</dt>
        <dd>
          <a href={`#${breakAnchor(longest)}`}>{longest.days} ngày</a><small>{longest.holidayNames[0]}</small>
        </dd>
      </div>
      {longestWithLeave && (
        <div>
          <dt>Nghỉ thêm 1 ngày</dt>
          <dd>
            <a href={`#${breakAnchor(longestWithLeave.item)}`}>{longestWithLeave.days} ngày liền</a>
            <small>{longestWithLeave.item.holidayNames[0]}</small>
          </dd>
        </div>
      )}
    </dl>
  );
}

function BreakList({ today, breaks, tours }: {
  today: string | null;
  breaks: HolidayBreak[] | null;
  tours: Resource<TourSummary[]>;
}) {
  if (today === null || breaks === null) return <LoadingState label="Đang tính các đợt nghỉ lễ…" />;
  if (breaks.length === 0) return <EmptyState title={`Chưa có ngày nghỉ lễ trong ${BREAK_HORIZON_MONTHS} tháng tới`} />;
  return (
    <ol className="breaks-list">
      {breaks.map(item => <li key={item.id}><HolidayBreakCard item={item} today={today} tours={tours} /></li>)}
    </ol>
  );
}

function RegionSelect({ value, onChange }: { value: Region; onChange: (region: Region) => void }) {
  return (
    <label className="breaks-region">
      <Icon name="map" size={18} />
      <span>Khởi hành từ</span>
      <select value={value} onChange={event => validRegion(event.target.value) && onChange(event.target.value)}>
        <option value="all">Tất cả điểm khởi hành</option>
        {regions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>
  );
}
