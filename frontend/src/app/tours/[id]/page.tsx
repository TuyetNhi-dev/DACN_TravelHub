import { notFound } from "next/navigation";
import { TourDetail } from "@/components/tours/TourDetail";
import { parseBookingPrefill } from "@/lib/cart-rules";
import { firstParam, isResourceId } from "@/lib/route-params";

export const metadata = { title: "Chi tiết tour | SàiHành" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** ?departure=&adults=&children= come from the cart's "Đặt ngay" and pre-fill the booking panel. */
export default async function TourPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isResourceId(id)) notFound();
  const values = Object.fromEntries(Object.entries(query).map(([key, value]) => [key, firstParam(value)]));
  return <TourDetail key={id} id={id} prefill={parseBookingPrefill(values)} />;
}
