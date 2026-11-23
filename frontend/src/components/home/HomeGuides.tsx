import { GuideCard } from "@/components/content/GuideCard";
import { TRAVEL_GUIDES } from "@/data/travel-guides";

const HOME_GUIDES = 3;

/** "Cẩm nang": the newest travel guides as cards. */
export function HomeGuides() {
  return (
    <ul className="guide-grid home-guides">
      {TRAVEL_GUIDES.slice(0, HOME_GUIDES).map(guide => <GuideCard key={guide.slug} guide={guide} headingLevel={3} />)}
    </ul>
  );
}
