"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { featuredDestinations } from "@/data/home";
import { destinationHref } from "@/lib/destinations";
import { getDestinationImages } from "@/lib/media";
import { countByDestination } from "@/lib/tour-groups";
import { useHomeTours } from "./HomeToursProvider";

// An open panel is about half the row on desktop and the full width on phones.
const PANEL_SIZES = "(max-width: 760px) 100vw, 640px";

/** Tour counts are shown only once the API has answered; nothing is estimated. */
function useTourCount(name: string): string | null {
  const { state } = useHomeTours();
  if (state.status !== "ready") return null;
  const count = countByDestination(state.data, name);
  return count > 0 ? `${count} tour` : "Đang cập nhật tour";
}

interface PanelProps {
  index: number;
  open: boolean;
  onOpen: (index: number) => void;
}

function DestinationPanel({ index, open, onOpen }: PanelProps) {
  const place = featuredDestinations[index];
  const image = getDestinationImages(place.name)[0];
  const count = useTourCount(place.name);
  const bodyId = `destination-panel-${index}`;
  return (
    <li className={`dest-panel${open ? " is-open" : ""}`} data-reveal-item
      onMouseEnter={() => onOpen(index)}>
      <Image src={image.src} alt={image.alt} fill sizes={PANEL_SIZES} />
      <span className="dest-panel-shade" aria-hidden="true" />
      {/* First tap opens the panel; the link inside it then leads to the destination. */}
      <button type="button" className="dest-panel-toggle" aria-expanded={open} aria-controls={bodyId}
        onClick={() => onOpen(index)} onFocus={() => onOpen(index)}>
        <small>{place.region}</small>
        <b>{place.name}</b>
      </button>
      <div className="dest-panel-body" id={bodyId}>
        <p>{place.note}</p>
        <Link className="dest-panel-link" href={destinationHref(place.name)} tabIndex={open ? 0 : -1}>
          {count ?? "Xem tour"} <Icon name="arrow" size={18} />
        </Link>
      </div>
      {image.illustrative && <span className="ui-media-note">Ảnh minh họa</span>}
    </li>
  );
}

/** "Điểm đến được yêu thích": tall cards side by side; the hovered, focused or tapped one widens. */
export function DestinationAccordion() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <ul className="dest-accordion">
      {featuredDestinations.map((place, index) => (
        <DestinationPanel key={place.name} index={index} open={index === openIndex} onOpen={setOpenIndex} />
      ))}
    </ul>
  );
}
