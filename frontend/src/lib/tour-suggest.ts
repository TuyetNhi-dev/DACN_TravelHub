/** Pure rules of the header search suggestions (ROADMAP 8.2). The server does the matching. */
import { formatCurrency } from "@/lib/format";
import type { TourSuggestions } from "@/types/tour";

/** Mirrors TourSearchRules.MinSuggestLength: shorter text is not sent at all. */
export const MIN_SUGGEST_LENGTH = 2;
const TOURS_PATH = "/tours";

export type SuggestKind = "destination" | "tour" | "search";

export interface SuggestOption {
  /** Stable within one list: used for the option's DOM id and React key. */
  key: string;
  kind: SuggestKind;
  label: string;
  detail: string;
  href: string;
}

export const canSuggest = (text: string) => text.trim().length >= MIN_SUGGEST_LENGTH;

export const searchHref = (text: string) => `${TOURS_PATH}?${new URLSearchParams({ q: text.trim() })}`;
export const destinationHref = (name: string) => `${TOURS_PATH}?${new URLSearchParams({ destination: name })}`;
export const tourPageHref = (id: string) => `${TOURS_PATH}/${encodeURIComponent(id)}`;

/** Destinations, then tours, then always "Tìm …" so Enter on the list can still search the typed text. */
export function suggestOptions(text: string, suggestions: TourSuggestions | null): SuggestOption[] {
  const destinations: SuggestOption[] = (suggestions?.destinations ?? []).map(item => ({
    key: "d" + item.id, kind: "destination", label: item.name, detail: `${item.tourCount} tour`,
    href: destinationHref(item.name),
  }));
  const tours: SuggestOption[] = (suggestions?.tours ?? []).map(item => ({
    key: "t" + item.id, kind: "tour", label: item.title,
    detail: `${item.destination} · ${item.code} · Từ ${formatCurrency(item.basePrice)}`, href: tourPageHref(item.id),
  }));
  const search: SuggestOption = {
    key: "search", kind: "search", label: `Tìm “${text.trim()}”`, detail: "Xem mọi tour phù hợp",
    href: searchHref(text),
  };
  return [...destinations, ...tours, search];
}

/** Arrow keys move through the list and wrap; -1 means no option is highlighted. */
export function moveActive(current: number, step: 1 | -1, count: number): number {
  if (count === 0) return -1;
  if (current < 0) return step === 1 ? 0 : count - 1;
  return (current + step + count) % count;
}
