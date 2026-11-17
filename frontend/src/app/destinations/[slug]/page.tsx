import { notFound } from "next/navigation";
import { DestinationPage } from "@/components/destinations/DestinationPage";
import { SLUG_PATTERN } from "@/lib/destinations";

export const metadata = { title: "Điểm đến | SàiHành" };

const MAX_SLUG_LENGTH = 80;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug.length > MAX_SLUG_LENGTH || !SLUG_PATTERN.test(slug)) notFound();
  return <DestinationPage slug={slug} />;
}
