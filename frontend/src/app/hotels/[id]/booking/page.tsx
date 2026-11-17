import { notFound } from "next/navigation";
import { HotelBookingPage } from "@/components/hotels/HotelBookingPage";
import { parseStay } from "@/lib/hotel-stay";
import { isResourceId } from "@/lib/route-params";

export const metadata = { title: "Gửi yêu cầu đặt phòng", robots: { index: false, follow: false } };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BookingPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isResourceId(id)) notFound();
  const roomTypeId = typeof query.roomType === "string" && isResourceId(query.roomType) ? query.roomType : "";
  return <HotelBookingPage key={id} hotelId={id} roomTypeId={roomTypeId} initialStay={parseStay(query)} />;
}
