import { notFound } from "next/navigation";
import { HotelDetailPage } from "@/components/hotels/HotelDetailPage";
import { parseStay } from "@/lib/hotel-stay";
import { isResourceId } from "@/lib/route-params";

export const metadata = { title: "Chi tiết khách sạn" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function HotelPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isResourceId(id)) notFound();
  return <HotelDetailPage key={id} hotelId={id} initialStay={parseStay(query)} />;
}
