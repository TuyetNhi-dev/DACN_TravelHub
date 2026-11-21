"use client";

import Link from "next/link";
import { TourCard } from "@/components/home/TourCard";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { useResource } from "@/hooks/useResource";
import { relatedTours } from "@/lib/content-search";
import { getTours } from "@/services/tours";

const SUGGESTED = 3;

/** Real tours from the catalogue that match the guide. A failed load just hides the block: the article stands alone. */
export function GuideRelatedTours({ keywords }: { keywords: string[] }) {
  const { state } = useResource("tours", getTours);
  if (state.status === "error") return null;
  const tours = state.status === "ready" ? relatedTours(state.data, keywords, SUGGESTED) : [];
  if (state.status === "ready" && tours.length === 0) return null;
  return (
    <section className="guide-related" aria-labelledby="guide-related-title">
      <h2 id="guide-related-title">Tour gợi ý cho bạn</h2>
      {state.status === "loading"
        ? <CardSkeletons count={SUGGESTED} label="Đang tải tour gợi ý…" />
        : <div className="guide-related-grid">{tours.map(tour => <TourCard key={tour.id} tour={tour} />)}</div>}
      <Link className="btn btn-outline" href="/tours">Xem tất cả tour</Link>
    </section>
  );
}
