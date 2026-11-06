import { HotelListPage } from "@/components/hotels/HotelListPage";
import { parseStay } from "@/lib/hotel-stay";

export default async function HotelsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const source = params.source === "demo" ? "demo" : "api";
  const initialQuery = typeof params.q === "string" ? params.q.slice(0, 200) : "";
  return <HotelListPage key={JSON.stringify(params)} source={source} initialQuery={initialQuery} initialStay={parseStay(params)} />;
}
