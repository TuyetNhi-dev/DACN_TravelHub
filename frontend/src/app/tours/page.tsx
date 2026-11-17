import { TourList } from "@/components/tours/TourList";
import { SLUG_PATTERN } from "@/lib/destinations";

export const metadata = { title: "Tour du lịch | SàiHành" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const MAX_QUERY_LENGTH = 200;
const MAX_SLUG_LENGTH = 80;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function ToursPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, MAX_QUERY_LENGTH);
  const date = typeof params.date === "string" && ISO_DATE.test(params.date) ? params.date : "";
  const raw = typeof params.collection === "string" ? params.collection : "";
  const collection = raw.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(raw) ? raw : "";
  return (
    <TourList key={query + date + collection} initialQuery={query} initialDate={date} collection={collection} />
  );
}
