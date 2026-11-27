"use client";

import Link from "next/link";
import { useDeparture } from "@/components/departure/DepartureProvider";
import { DateLeaf } from "@/components/holidays/DateLeaf";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Resource } from "@/hooks/useResource";
import { useHolidayBreaks } from "@/hooks/useHolidayBreaks";
import { breakAnchor, rangeLabel, startsInLabel, toursForBreak, type HolidayBreak } from "@/lib/holiday-breaks";
import type { TourSummary } from "@/types/tour";
import { useHomeTours } from "./HomeToursProvider";

const HOME_BREAKS = 3;

/** Home teaser of /ky-nghi: the next few breaks and how many tours fit each one. */
export function HomeHolidayBreaks() {
  return (
    <section className="home-section" aria-labelledby="breaks-title">
      <Reveal className="container">
        <SectionHeader id="breaks-title" eyebrow="Kỳ nghỉ thông minh" title="Đợt nghỉ lễ sắp tới"
          description="Ngày lễ theo luật cộng cuối tuần liền kề; lịch nghỉ bù do Nhà nước công bố hằng năm."
          link={{ href: "/ky-nghi", label: "Xem tất cả kỳ nghỉ" }} />
        <BreakTiles />
      </Reveal>
    </section>
  );
}

function BreakTiles() {
  const { region } = useDeparture();
  const { state } = useHomeTours();
  const { today, breaks, tours } = useHolidayBreaks(state, region);
  if (today === null || breaks === null) return <TileSkeletons />;
  if (breaks.length === 0) return <p className="break-status">Chưa có ngày nghỉ lễ trong thời gian tới.</p>;
  return (
    <ul className="home-breaks">
      {breaks.slice(0, HOME_BREAKS).map(item => (
        <HomeBreakTile key={item.id} item={item} today={today} tours={tours} />
      ))}
    </ul>
  );
}

/** Same footprint as the tiles, so the section does not jump when the dates appear. */
function TileSkeletons() {
  return (
    <div className="home-breaks" role="status" aria-busy="true">
      <span className="sr-only">Đang tính các đợt nghỉ lễ…</span>
      {Array.from({ length: HOME_BREAKS }, (_, index) => (
        <div key={index} className="home-break-skeleton" aria-hidden="true">
          <Skeleton className="ui-skeleton--short" /><Skeleton /><Skeleton className="ui-skeleton--mid" />
        </div>
      ))}
    </div>
  );
}

function HomeBreakTile({ item, today, tours }: { item: HolidayBreak; today: string; tours: Resource<TourSummary[]> }) {
  return (
    <li>
      <Link className="home-break-link" href={`/ky-nghi#${breakAnchor(item)}`}>
        <span className="home-break-top">
          <DateLeaf date={item.start} />
          <span className="break-chips">
            <span className="break-chip break-chip--days">{item.days} ngày nghỉ</span>
            <span className={item.start <= today ? "break-chip break-chip--live" : "break-chip"}>
              {startsInLabel(today, item)}
            </span>
          </span>
        </span>
        <b className="home-break-name">{item.holidayNames.join(" · ")}</b>
        <time className="home-break-range" dateTime={item.start}>{rangeLabel(item.start, item.end)}</time>
        <span className="home-break-foot">
          <span>{tourCountLabel(item, tours)}</span>
          <Icon name="arrow" size={16} />
        </span>
      </Link>
    </li>
  );
}

function tourCountLabel(item: HolidayBreak, tours: Resource<TourSummary[]>): string {
  if (tours.status === "loading") return "Đang tìm tour…";
  if (tours.status === "error") return "Xem tour phù hợp";
  const count = toursForBreak(tours.data, item).length;
  return count > 0 ? `${count} tour vừa đợt nghỉ` : "Xem gợi ý tour";
}
