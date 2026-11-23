import { departureRegion, regions } from "@/lib/departure-region";
import { normalizeSearch } from "@/lib/format";
import type { TourSummary } from "@/types/tour";

/** Home "Tour trọn gói" tabs: tours grouped by where they go, not where they leave from. */
export type DestinationRegion = NonNullable<ReturnType<typeof departureRegion>>;
export type DestinationTabId = "all" | DestinationRegion;

export interface DestinationTab {
  id: DestinationTabId;
  label: string;
}

const ALL_TAB: DestinationTab = { id: "all", label: "Tất cả" };

// "hcm" is a departure city choice, not a region a tour can go to; the city itself falls under southeast.
const REGION_TABS: DestinationTab[] = regions
  .filter(region => region.id !== "hcm")
  .map(region => ({ id: region.id as DestinationRegion, label: region.label }));

// Tour destinations that are towns or islands rather than province names. Each maps to its (pre-merger)
// province so the region comes from the same province list the departure filter uses.
const PLACE_PROVINCES = new Map(Object.entries({
  "Hạ Long": "Quảng Ninh",
  "Vân Đồn": "Quảng Ninh",
  "Sa Pa": "Lào Cai",
  "Mộc Châu": "Sơn La",
  "Tam Đảo": "Vĩnh Phúc",
  "Vinh": "Nghệ An",
  "Hội An": "Quảng Nam",
  "Lý Sơn": "Quảng Ngãi",
  "Mũi Né": "Bình Thuận",
  "Côn Đảo": "Bà Rịa Vũng Tàu",
}).map(([place, province]) => [normalizeSearch(place), province]));

export function destinationRegion(destination: string): DestinationRegion | null {
  return departureRegion(PLACE_PROVINCES.get(normalizeSearch(destination)) ?? destination);
}

export function inDestinationTab(tour: TourSummary, tab: DestinationTabId): boolean {
  return tab === "all" || destinationRegion(tour.destination) === tab;
}

/** "Tất cả" plus only the regions that have at least one of the given tours, so no tab opens empty. */
export function destinationTabsFor(tours: TourSummary[]): DestinationTab[] {
  const present = new Set(tours.map(tour => destinationRegion(tour.destination)));
  return [ALL_TAB, ...REGION_TABS.filter(tab => present.has(tab.id as DestinationRegion))];
}

/** Tours that still have an open departure, in the tab's region, in API order. */
export function packageTours(tours: TourSummary[], tab: DestinationTabId, limit: number): TourSummary[] {
  return tours
    .filter(tour => tour.upcomingDepartureDates.length > 0 && inDestinationTab(tour, tab))
    .slice(0, limit);
}

/** First dates shown as chips on a card; the rest collapse into "+N". */
export function departureChips(dates: string[], max: number): { shown: string[]; hidden: number } {
  return { shown: dates.slice(0, max), hidden: Math.max(0, dates.length - max) };
}

/** "2026-11-25" → "25/11": the card already says the year is upcoming, the chip stays short. */
export function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}
