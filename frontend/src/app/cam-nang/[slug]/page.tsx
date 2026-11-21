import { notFound } from "next/navigation";
import { GuideArticle } from "@/components/content/GuideArticle";
import { TRAVEL_GUIDES, findGuide } from "@/data/travel-guides";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return TRAVEL_GUIDES.map(guide => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const guide = findGuide((await params).slug);
  return { title: guide ? `${guide.title} | Cẩm nang SàiHành` : "Cẩm nang du lịch | SàiHành" };
}

export default async function GuidePage({ params }: { params: Params }) {
  const guide = findGuide((await params).slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} />;
}
