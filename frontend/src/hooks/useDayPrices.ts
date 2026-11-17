"use client";

import { useResource } from "@/hooks/useResource";
import { getPriceCalendar } from "@/services/flights";
import type { FlightDayPrice, FlightRoute } from "@/types/flight";

/** Lowest quote per day for every month in `months`, merged into one lookup by "yyyy-mm-dd". */
export function useDayPrices(route: FlightRoute, months: readonly string[]) {
  const key = JSON.stringify({ ...route, months });
  return useResource(key, async signal => {
    const calendars = await Promise.all(months.map(month => getPriceCalendar(route, month, signal)));
    return new Map<string, FlightDayPrice>(calendars.flatMap(calendar => calendar.days.map(day => [day.date, day])));
  });
}
