import { Icon, type IconName } from "@/components/ui/Icon";
import type { TourInclusions as Inclusions } from "@/types/tour";

/**
 * "Giá tour bao gồm" and "Không bao gồm". Side by side on wider screens, stacked on phones; each list is a
 * native <details> so it can be folded away without JavaScript. Hidden when the tour has no lines yet.
 */
export function TourInclusions({ inclusions }: { inclusions: Inclusions }) {
  if (inclusions.included.length === 0 && inclusions.excluded.length === 0) return null;
  return (
    <section className="tour-inclusions" aria-labelledby="tour-inclusions-title">
      <h2 id="tour-inclusions-title">Chi phí tour</h2>
      <div className="tour-inclusions-grid">
        <InclusionList title="Giá tour bao gồm" lines={inclusions.included} icon="check" tone="included" />
        <InclusionList title="Không bao gồm" lines={inclusions.excluded} icon="close" tone="excluded" />
      </div>
    </section>
  );
}

interface InclusionListProps {
  title: string;
  lines: string[];
  icon: IconName;
  tone: "included" | "excluded";
}

function InclusionList({ title, lines, icon, tone }: InclusionListProps) {
  if (lines.length === 0) return null;
  return (
    <details className={`tour-inclusion tour-inclusion--${tone}`} open>
      <summary>
        <h3>{title}</h3>
        <span className="tour-inclusion-count">{lines.length} mục</span>
        <span className="tour-inclusion-chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
      </summary>
      <ul>
        {lines.map((line, index) => (
          <li key={`${index}-${line}`}>
            <span className="tour-inclusion-icon" aria-hidden="true"><Icon name={icon} size={16} /></span>
            {line}
          </li>
        ))}
      </ul>
    </details>
  );
}
