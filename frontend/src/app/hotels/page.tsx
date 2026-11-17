import { HotelListPage } from "@/components/hotels/HotelListPage";
import { parseStay } from "@/lib/hotel-stay";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const MAX_QUERY_LENGTH = 200;

export default async function HotelsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, MAX_QUERY_LENGTH) : "";
  return <HotelListPage key={JSON.stringify(params)} initialQuery={query} initialStay={parseStay(params)} />;
}
