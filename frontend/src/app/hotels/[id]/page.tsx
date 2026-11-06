import { notFound } from "next/navigation";
import { HotelDetailPage } from "@/components/hotels/HotelDetailPage";
import { parseStay } from "@/lib/hotel-stay";

export const metadata = { title: "Chi tiết khách sạn" };
export default async function HotelPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!id.trim() || id.length > 12) notFound();
  const source = query.source === "demo" ? "demo" : "api";
  return <HotelDetailPage key={id + JSON.stringify(query)} hotelId={id} source={source} initialStay={parseStay(query)} />;
}
