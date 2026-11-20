import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePage } from "@/components/services/ServicePage";
import { EXTRA_SERVICES, findExtraService } from "@/data/extra-services";

interface Props { params: Promise<{ slug: string }> }

// Only the known services exist; any other slug is a 404 without rendering.
export const dynamicParams = false;

export function generateStaticParams() {
  return EXTRA_SERVICES.map(service => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = findExtraService((await params).slug);
  return service
    ? { title: `${service.name} | SàiHành`, description: service.lead }
    : { title: "Không tìm thấy dịch vụ | SàiHành" };
}

export default async function ExtraServicePage({ params }: Props) {
  const service = findExtraService((await params).slug);
  if (!service) notFound();
  return <ServicePage service={service} />;
}
