import { notFound } from "next/navigation";
import { TicketPage } from "@/components/bookings/TicketPage";
import { isResourceId } from "@/lib/route-params";

export const metadata = { title: "Vé điện tử | SàiHành", robots: { index: false, follow: false } };

export default async function BookingTicket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isResourceId(id)) notFound();
  return <TicketPage key={id} bookingId={id} />;
}
