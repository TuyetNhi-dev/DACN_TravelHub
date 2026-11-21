import type { FaqGroup } from "@/data/help-faq";
import { normalizeSearch } from "@/lib/format";
import type { TourSummary } from "@/types/tour";

/**
 * Questions whose text or answer contains every word typed, ignoring accents and case ("huy don" finds
 * "Hủy đơn"). Groups left without a match are dropped; an empty query returns everything.
 */
export function filterFaq(groups: FaqGroup[], query: string): FaqGroup[] {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return groups;
  return groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        const text = normalizeSearch([group.title, item.question, ...item.answer].join(" "));
        return words.every(word => text.includes(word));
      }),
    }))
    .filter(group => group.items.length > 0);
}

/** Tours matching a guide: destination or title contains one of the keywords (accent-insensitive). */
export function relatedTours(tours: TourSummary[], keywords: string[], limit: number): TourSummary[] {
  const wanted = keywords.map(normalizeSearch);
  return tours
    .filter(tour => {
      const text = normalizeSearch(`${tour.destination} ${tour.title}`);
      return wanted.some(word => text.includes(word));
    })
    .slice(0, limit);
}
