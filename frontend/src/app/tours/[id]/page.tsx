import { notFound } from "next/navigation";
import { TourDetail } from "@/components/tours/TourDetail";
import { isResourceId } from "@/lib/route-params";

export const metadata = { title: "Chi tiết tour | SàiHành" };

export default async function TourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isResourceId(id)) notFound();
  return <TourDetail key={id} id={id} />;
}
