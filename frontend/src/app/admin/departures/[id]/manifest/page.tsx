import { notFound } from "next/navigation";
import { ManifestPage } from "@/components/admin/departures/ManifestPage";
import { isResourceId } from "@/lib/route-params";

export const metadata = { title: "Danh sách đoàn | SàiHành", robots: { index: false, follow: false } };

export default async function AdminManifest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isResourceId(id)) notFound();
  return <ManifestPage key={id} departureId={id} />;
}
