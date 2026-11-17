import { notFound } from "next/navigation";
import { CustomerBookingPage } from "@/components/bookings/CustomerBookingPage";
import { isResourceId } from "@/lib/route-params";

export const metadata = { title: "Chi tiết đơn | SàiHành", robots: { index: false, follow: false } };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BookingPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isResourceId(id)) notFound();
  return <CustomerBookingPage key={id} bookingId={id} justCreated={query.created === "1"} />;
}
