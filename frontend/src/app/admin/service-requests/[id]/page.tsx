import { notFound } from "next/navigation";
import { ServiceRequestAdminPage } from "@/components/admin/ServiceRequestAdminPage";
import { isResourceId } from "@/lib/route-params";

export const metadata = { title: "Xử lý yêu cầu tư vấn | SàiHành", robots: { index: false, follow: false } };

export default async function AdminServiceRequest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isResourceId(id)) notFound();
  return <ServiceRequestAdminPage key={id} requestId={id} />;
}
