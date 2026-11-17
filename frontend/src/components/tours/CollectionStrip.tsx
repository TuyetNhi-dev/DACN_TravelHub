import Image from "next/image";
import Link from "next/link";
import { collectionHref } from "@/lib/destinations";
import { getDestinationImages } from "@/lib/media";
import type { TourCollection } from "@/types/tour";

interface CollectionStripProps {
  collections: TourCollection[];
  /** Slug of the collection being viewed, highlighted in the strip. */
  active?: string;
  /** Adds an "all tours" pill first, for the tour list page. */
  showAll?: boolean;
}

/** Horizontally scrolling pills with a round photo, one per seasonal collection. */
export function CollectionStrip({ collections, active, showAll = false }: CollectionStripProps) {
  const visible = collections.filter(collection => collection.tourCount > 0);
  if (visible.length === 0) return null;
  return (
    <nav className="collection-strip" aria-label="Tour theo mùa">
      {showAll && (
        <Link href="/tours" className="collection-pill collection-pill--all"
          aria-current={!active ? "page" : undefined}>
          Tất cả tour
        </Link>
      )}
      {visible.map(collection => {
        const image = getDestinationImages(collection.coverPlace)[0];
        const current = collection.slug === active;
        return (
          <Link key={collection.slug} href={collectionHref(collection.slug)} className="collection-pill"
            aria-current={current ? "page" : undefined} title={collection.tagline ?? undefined}>
            <span className="collection-pill-photo"><Image src={image.src} alt="" fill sizes="44px" /></span>
            <span className="collection-pill-text">
              <strong>{collection.name}</strong>
              {collection.seasonLabel && <small>{collection.seasonLabel}</small>}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
