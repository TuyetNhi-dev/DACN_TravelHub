import { notFound } from "next/navigation";
import { TourEditPage } from "@/components/admin/tours/TourEditPage";
import { isResourceId } from "@/lib/route-params";

export const metadata = { title: "Sửa tour | SàiHành", robots: { index: false, follow: false } };

export default async function AdminTourEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isResourceId(id)) notFound();
  return <TourEditPage key={id} tourId={id} />;
}
