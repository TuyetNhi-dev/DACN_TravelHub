"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { featuredDestinations } from "@/data/home";
import { destinationHref } from "@/lib/destinations";
import { getDestinationImages } from "@/lib/media";
import { countByDestination } from "@/lib/tour-groups";
import { useHomeTours } from "./HomeToursProvider";

const LARGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1080px) 100vw, 50vw";
const SMALL_SIZES = "(max-width: 640px) 50vw, (max-width: 1080px) 50vw, 25vw";

/** Tour counts are shown only once the API has answered; nothing is estimated. */
function useTourCount(name: string): string | null {
  const { state } = useHomeTours();
  if (state.status !== "ready") return null;
  const count = countByDestination(state.data, name);
  return count > 0 ? `${count} tour` : "Đang cập nhật tour";
}

function DestinationTile({ name, region, note, large }: {
  name: string;
  region: string;
  note: string;
  large: boolean;
}) {
  const image = getDestinationImages(name)[0];
  const count = useTourCount(name);
  return (
    <Link className={`destination-tile${large ? " is-large" : ""}`} data-reveal-item
      href={destinationHref(name)}>
      <Image src={image.src} alt={image.alt} fill sizes={large ? LARGE_SIZES : SMALL_SIZES} />
      <span className="destination-tile-shade" />
      <span className="destination-tile-body">
        <small>{region}</small>
        <b>{name}</b>
        <span>{note}</span>
      </span>
      <span className="destination-tile-meta">
        {count && <span className="destination-tile-count">{count}</span>}
        <span className="destination-tile-go" aria-hidden="true"><Icon name="arrow" size={18} /></span>
      </span>
      {image.illustrative && <span className="ui-media-note">Ảnh minh họa</span>}
    </Link>
  );
}

export function DestinationMosaic() {
  return (
    <div className="destination-mosaic">
      {featuredDestinations.map((place, index) => (
        <DestinationTile key={place.name} {...place} large={index === 0} />
      ))}
    </div>
  );
}
