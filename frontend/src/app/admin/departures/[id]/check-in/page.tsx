import { notFound } from "next/navigation";
import { CheckInPage } from "@/components/admin/check-in/CheckInPage";
import { isResourceId } from "@/lib/route-params";

export const metadata = { title: "Check-in đoàn | SàiHành", robots: { index: false, follow: false } };

export default async function AdminCheckIn({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isResourceId(id)) notFound();
  return <CheckInPage key={id} departureId={id} />;
}
