import { TourList } from "@/components/tours/TourList";
import { SLUG_PATTERN } from "@/lib/destinations";

export const metadata = { title: "Tour du lịch | SàiHành" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const MAX_QUERY_LENGTH = 200;
const MAX_SLUG_LENGTH = 80;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** locations.name is at most 160 characters. */
const MAX_DESTINATION_LENGTH = 160;

export default async function ToursPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, MAX_QUERY_LENGTH);
  const date = typeof params.date === "string" && ISO_DATE.test(params.date) ? params.date : "";
  // Set by a destination suggestion of the header search; an unknown name simply matches no destination option.
  const destination = (typeof params.destination === "string" ? params.destination : "").trim()
    .slice(0, MAX_DESTINATION_LENGTH);
  const raw = typeof params.collection === "string" ? params.collection : "";
  const collection = raw.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(raw) ? raw : "";
  return (
    <TourList key={[query, date, destination, collection].join("|")} initialQuery={query} initialDate={date}
      initialDestination={destination} collection={collection} />
  );
}
