import Image from "next/image";
import Link from "next/link";
import type { TravelGuide } from "@/data/travel-guides";
import { getDestinationImages } from "@/lib/media";

const CARD_SIZES = "(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 380px";

/** One guide teaser; the title link covers the whole card. The photo is decorative (the title says it all). */
export function GuideCard({ guide, headingLevel = 2 }: { guide: TravelGuide; headingLevel?: 2 | 3 }) {
  const image = getDestinationImages(guide.coverPlace)[0];
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <li className="guide-card" data-reveal-item>
      <div className="guide-card-media">
        {image && <Image src={image.src} alt="" fill sizes={CARD_SIZES} />}
      </div>
      <div className="guide-card-body">
        <span className="guide-card-tags">{guide.tags.join(" · ")}</span>
        <Heading><Link className="ui-stretched" href={`/cam-nang/${guide.slug}`}>{guide.title}</Link></Heading>
        <p>{guide.summary}</p>
        <span className="guide-card-updated">Cập nhật: {guide.updated}</span>
      </div>
    </li>
  );
}
