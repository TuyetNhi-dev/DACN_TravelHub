import { notFound } from "next/navigation";
import { HotelBookingPage } from "@/components/hotels/HotelBookingPage";
import { parseStay } from "@/lib/hotel-stay";

export const metadata = { title: "Đặt phòng demo", robots: { index: false, follow: false } };
export default async function BookingPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!id.trim() || id.length > 12) notFound();
  return <HotelBookingPage key={id + JSON.stringify(query)} hotelId={id} source={query.source === "demo" ? "demo" : "api"}
    initialStay={parseStay(query)} initialRoom={typeof query.room === "string" ? query.room.slice(0, 12) : ""} />;
}
