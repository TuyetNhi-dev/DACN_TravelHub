/** Groups tour departures by calendar day for the departure calendar on the tour page. */
import type { TourDeparture } from "@/types/tour";

export interface DepartureDay {
  date: string;
  departures: TourDeparture[];
  /** Departure chosen when the day is picked: the cheapest bookable one, or null when none is bookable. */
  pick: TourDeparture | null;
  /** Lowest adult price among bookable departures, else among all departures of the day. */
  lowestPrice: number;
  /** Seats left across bookable departures of the day. */
  seats: number;
  soldOut: boolean;
}

export function departureDays(departures: readonly TourDeparture[]): Map<string, DepartureDay> {
  const groups = new Map<string, TourDeparture[]>();
  for (const departure of departures) {
    groups.set(departure.departureDate, [...(groups.get(departure.departureDate) ?? []), departure]);
  }
  const days = new Map<string, DepartureDay>();
  for (const [date, items] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    const bookable = items.filter(item => item.isBookable);
    const priced = bookable.length ? bookable : items;
    days.set(date, {
      date,
      departures: items,
      pick: bookable.length ? bookable.reduce((a, b) => (b.adultPrice < a.adultPrice ? b : a)) : null,
      lowestPrice: Math.min(...priced.map(item => item.adultPrice)),
      seats: bookable.reduce((sum, item) => sum + item.availableSeats, 0),
      soldOut: bookable.length === 0,
    });
  }
  return days;
}

/** Month ("yyyy-mm") the calendar opens on: the chosen departure, else the first bookable one, else today. */
export function initialDepartureMonth(days: Map<string, DepartureDay>, selected: string | null, today: string): string {
  const first = [...days.values()].find(day => day.pick !== null && day.date >= today);
  return (selected ?? first?.date ?? today).slice(0, 7);
}
