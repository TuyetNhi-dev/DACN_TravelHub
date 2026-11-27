"use client";

import { useDeparture } from "@/components/departure/DepartureProvider";
import { ListingHero } from "@/components/listing/ListingHero";
import { CardSkeletons } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { getDestinationImages } from "@/lib/media";
import { EMPTY_TOUR_FILTERS, type TourFilters } from "@/lib/tour-display";
import { getTourCollection, getTourCollections, getTourDestinations } from "@/services/tours";
import type { TourCollection } from "@/types/tour";
import { CollectionStrip } from "./CollectionStrip";
import { TourResults } from "./TourResults";
import { TourSearchResults } from "./TourSearchResults";

const HERO_DESTINATION = "Ninh Bình";
const SKELETON_COUNT = 6;
const CRUMBS = [{ label: "Trang chủ", href: "/" }, { label: "Tour du lịch", href: "/tours" }];

interface TourListProps {
  initialQuery?: string;
  initialDate?: string;
  /** Destination name, from a destination suggestion of the header search. */
  initialDestination?: string;
  /** Slug of a seasonal collection; empty shows every published tour. */
  collection?: string;
}

export function TourList({ initialQuery = "", initialDate = "", initialDestination = "", collection = "" }:
  TourListProps) {
  const filters = { ...EMPTY_TOUR_FILTERS, query: initialQuery, date: initialDate, destination: initialDestination };
  return (
    <main id="main-content" className="listing-page">
      {collection ? <CollectionTours slug={collection} filters={filters} /> : <AllTours filters={filters} />}
    </main>
  );
}

/** The full catalogue, searched on the server. */
function AllTours({ filters }: { filters: TourFilters }) {
  const { region, choose } = useDeparture();
  const destinations = useResource("tour-destinations", getTourDestinations).state;
  const published = destinations.status === "ready"
    ? destinations.data.reduce((sum, item) => sum + item.tourCount, 0)
    : null;
  return (
    <>
      <ListingHero crumbs={[CRUMBS[0], { label: "Tour du lịch" }]} eyebrow="Tour trọn gói"
        title="Khám phá tour du lịch"
        description="Tour do SàiHành điều hành: lịch khởi hành rõ ràng, giữ chỗ ngay khi bạn đặt."
        image={getDestinationImages(HERO_DESTINATION)[0]}>
        {published !== null && <span><strong>{published}</strong> tour đang mở bán</span>}
      </ListingHero>
      <div className="container listing-body">
        <Collections active="" />
        {region === null
          ? <CardSkeletons count={SKELETON_COUNT} label="Đang tải danh sách tour…" />
          : <TourSearchResults key={region} region={region} showAll={() => choose("all")} initialFilters={filters}
              destinations={destinations} />}
      </div>
    </>
  );
}

/** A seasonal collection: a short list loaded at once and filtered in the page. */
function CollectionTours({ slug, filters }: { slug: string; filters: TourFilters }) {
  const { region, choose } = useDeparture();
  const { state, retry } = useResource(`tour-collection:${slug}`, signal => getTourCollection(slug, signal));
  const detail = state.status === "ready" ? state.data : null;
  return (
    <>
      {detail ? <CollectionHero collection={detail.collection} count={detail.tours.length} /> : <PlainHero />}
      <div className="container listing-body">
        <Collections active={slug} />
        {(!detail || region === null) && state.status !== "error" && (
          <CardSkeletons count={SKELETON_COUNT} label="Đang tải danh sách tour…" />
        )}
        {state.status === "error" && <ErrorState error={state.error} onRetry={retry} backHref="/tours" />}
        {detail && region !== null && (
          <TourResults key={region} tours={detail.tours} region={region} showAll={() => choose("all")}
            initialFilters={filters} />
        )}
      </div>
    </>
  );
}

function Collections({ active }: { active: string }) {
  const { state } = useResource("tour-collections", getTourCollections);
  if (state.status !== "ready") return null;
  return <CollectionStrip collections={state.data} active={active || undefined} showAll />;
}

function CollectionHero({ collection, count }: { collection: TourCollection; count: number }) {
  return (
    <ListingHero crumbs={[...CRUMBS, { label: collection.name }]} eyebrow={collection.seasonLabel ?? "Tour theo mùa"}
      title={collection.name} description={collection.tagline ?? "Tour chọn lọc theo mùa đẹp nhất trong năm."}
      image={getDestinationImages(collection.coverPlace)[0]}>
      <span><strong>{count}</strong> tour trong bộ sưu tập</span>
    </ListingHero>
  );
}

/** While a collection loads, the plain tour hero holds the space. */
function PlainHero() {
  return (
    <ListingHero crumbs={[CRUMBS[0], { label: "Tour du lịch" }]} eyebrow="Tour trọn gói"
      title="Khám phá tour du lịch" description="Đang tải bộ sưu tập tour…"
      image={getDestinationImages(HERO_DESTINATION)[0]} />
  );
}
