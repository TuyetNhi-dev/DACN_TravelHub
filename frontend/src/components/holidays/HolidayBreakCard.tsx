import { Icon } from "@/components/ui/Icon";
import type { Resource } from "@/hooks/useResource";
import {
  breakAnchor, dayLabel, rangeLabel, startsInLabel, type BridgeDay, type HolidayBreak,
} from "@/lib/holiday-breaks";
import type { TourSummary } from "@/types/tour";
import { BreakDayStrip } from "./BreakDayStrip";
import { BreakTours } from "./BreakTours";
import { DateLeaf } from "./DateLeaf";

interface HolidayBreakCardProps {
  item: HolidayBreak;
  today: string;
  tours: Resource<TourSummary[]>;
}

export function HolidayBreakCard({ item, today, tours }: HolidayBreakCardProps) {
  const anchor = breakAnchor(item);
  const running = item.start <= today;
  return (
    <article className="break-card" id={anchor} aria-labelledby={`${anchor}-title`}>
      <header className="break-card-head">
        <DateLeaf date={item.start} />
        <div className="break-card-title">
          <p className="break-chips">
            <span className="break-chip break-chip--days">{item.days} ngày nghỉ</span>
            <span className={running ? "break-chip break-chip--live" : "break-chip"}>
              {startsInLabel(today, item)}
            </span>
          </p>
          <h2 id={`${anchor}-title`}>{item.holidayNames.join(" · ")}</h2>
          <p className="break-card-range"><time dateTime={item.start}>{rangeLabel(item.start, item.end)}</time></p>
        </div>
      </header>
      <BreakDayStrip item={item} />
      {(item.scheduleNote || item.bridge) && (
        <div className="break-notes">
          {item.scheduleNote && (
            <p className="break-note"><Icon name="alert" size={16} /><span>{item.scheduleNote}</span></p>
          )}
          {item.bridge && <BridgeTip bridge={item.bridge} />}
        </div>
      )}
      <BreakTours item={item} tours={tours} />
    </article>
  );
}

function BridgeTip({ bridge }: { bridge: BridgeDay }) {
  return (
    <p className="break-tip">
      <Icon name="sun" size={16} />
      <span>
        Xin nghỉ thêm <strong>{dayLabel(bridge.leaveDate)}</strong> để có <strong>{bridge.days} ngày liền</strong>:{" "}
        {rangeLabel(bridge.start, bridge.end)}.
      </span>
    </p>
  );
}
