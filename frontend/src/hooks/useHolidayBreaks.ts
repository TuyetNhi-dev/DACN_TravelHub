"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Resource } from "@/hooks/useResource";
import { filterByDeparture, type Region } from "@/lib/departure-region";
import { vietnamToday } from "@/lib/format";
import { holidayBreaks, type HolidayBreak } from "@/lib/holiday-breaks";
import type { TourSummary } from "@/types/tour";

interface HolidayBreaksView {
  /** Today in Vietnam; null before the browser renders, like `breaks`. */
  today: string | null;
  /** null until the browser renders: the page is prerendered, so a build-time "today" would be stale. */
  breaks: HolidayBreak[] | null;
  /** The catalogue narrowed to the departure region; "loading" until the region is known. */
  tours: Resource<TourSummary[]>;
}

const LOADING = { status: "loading" } as const;
const noSubscription = () => () => {};

/**
 * Breaks from today in Vietnam and the tours to match against them. The region filter works on the tour's
 * departure cities, like every other tour list of the site, not on each departure date.
 */
export function useHolidayBreaks(catalogue: Resource<TourSummary[]>, region: Region | null): HolidayBreaksView {
  const today = useSyncExternalStore(noSubscription, () => vietnamToday(), () => null);
  const breaks = useMemo(() => (today === null ? null : holidayBreaks(today)), [today]);
  const tours = useMemo((): Resource<TourSummary[]> => {
    if (catalogue.status !== "ready") return catalogue;
    if (region === null) return LOADING;
    return { status: "ready", data: filterByDeparture(catalogue.data, region) };
  }, [catalogue, region]);
  return { today, breaks, tours };
}
