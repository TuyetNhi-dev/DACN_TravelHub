import { notFound } from "next/navigation";
import { AdminBookingPage } from "@/components/admin/AdminBookingPage";
import { isResourceId } from "@/lib/route-params";

export const metadata = { title: "Xử lý đơn | SàiHành", robots: { index: false, follow: false } };

export default async function AdminBooking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isResourceId(id)) notFound();
  return <AdminBookingPage key={id} bookingId={id} />;
}
