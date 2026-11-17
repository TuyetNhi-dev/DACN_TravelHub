"use client";

import { useDeparture } from "@/components/departure/DepartureProvider";
import { ListingHero } from "@/components/listing/ListingHero";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { getDestinationImages } from "@/lib/media";
import { EMPTY_TOUR_FILTERS } from "@/lib/tour-display";
import { getTourCollection, getTourCollections, getTours } from "@/services/tours";
import type { TourCollection, TourSummary } from "@/types/tour";
import { CollectionStrip } from "./CollectionStrip";
import { TourResults } from "./TourResults";

const HERO_DESTINATION = "Ninh Bình";
const SKELETON_COUNT = 6;

interface TourListProps {
  initialQuery?: string;
  initialDate?: string;
  /** Slug of a seasonal collection; empty shows every published tour. */
  collection?: string;
}

interface TourPage {
  tours: TourSummary[];
  collection: TourCollection | null;
}

async function loadTours(slug: string, signal: AbortSignal): Promise<TourPage> {
  if (!slug) return { tours: await getTours(signal), collection: null };
  const detail = await getTourCollection(slug, signal);
  return { tours: detail.tours, collection: detail.collection };
}

export function TourList({ initialQuery = "", initialDate = "", collection = "" }: TourListProps) {
  const { region, choose } = useDeparture();
  const { state, retry } = useResource(`tours:${collection}`, signal => loadTours(collection, signal));
  const page = state.status === "ready" ? state.data : null;
  const filters = { ...EMPTY_TOUR_FILTERS, query: initialQuery, date: initialDate };
  return (
    <main id="main-content" className="listing-page">
      <TourHero page={page} />
      <div className="container listing-body">
        <Collections active={collection} />
        {(!page || region === null) && state.status !== "error" && (
          <CardSkeletons count={SKELETON_COUNT} label="Đang tải danh sách tour…" />
        )}
        {state.status === "error" && <ErrorState error={state.error} onRetry={retry} backHref="/tours" />}
        {page && region !== null && (
          <TourResults key={region} tours={page.tours} region={region} showAll={() => choose("all")}
            initialFilters={filters} />
        )}
      </div>
    </main>
  );
}

function Collections({ active }: { active: string }) {
  const { state } = useResource("tour-collections", getTourCollections);
  if (state.status !== "ready") return null;
  return <CollectionStrip collections={state.data} active={active || undefined} showAll />;
}

function TourHero({ page }: { page: TourPage | null }) {
  const crumbs = [{ label: "Trang chủ", href: "/" }, { label: "Tour du lịch", href: "/tours" }];
  const current = page?.collection;
  if (current) {
    return (
      <ListingHero crumbs={[...crumbs, { label: current.name }]} eyebrow={current.seasonLabel ?? "Tour theo mùa"}
        title={current.name} description={current.tagline ?? "Tour chọn lọc theo mùa đẹp nhất trong năm."}
        image={getDestinationImages(current.coverPlace)[0]}>
        <span><strong>{page.tours.length}</strong> tour trong bộ sưu tập</span>
      </ListingHero>
    );
  }
  return (
    <ListingHero crumbs={[crumbs[0], { label: "Tour du lịch" }]} eyebrow="Tour trọn gói" title="Khám phá tour du lịch"
      description="Tour do SàiHành điều hành: lịch khởi hành rõ ràng, giữ chỗ ngay khi bạn đặt."
      image={getDestinationImages(HERO_DESTINATION)[0]}>
      {page && <span><strong>{page.tours.length}</strong> tour đang mở bán</span>}
    </ListingHero>
  );
}
