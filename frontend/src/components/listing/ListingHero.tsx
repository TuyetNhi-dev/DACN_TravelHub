import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumb, type Crumb } from "@/components/ui/Breadcrumb";
import type { MediaImage } from "@/lib/media";

interface ListingHeroProps {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  description: string;
  image: MediaImage;
  /** Short facts under the description, e.g. counts. */
  children?: ReactNode;
}

/** Photo banner shared by the listing pages (tours, hotels). */
export function ListingHero({ crumbs, eyebrow, title, description, image, children }: ListingHeroProps) {
  return (
    <header className="listing-hero">
      <Image src={image.src} alt="" fill priority sizes="100vw" className="listing-hero-photo" />
      <div className="listing-hero-shade" aria-hidden="true" />
      <div className="container listing-hero-inner">
        <Breadcrumb items={crumbs} />
        <span className="ui-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children && <div className="listing-hero-facts">{children}</div>}
      </div>
      {image.illustrative && <span className="ui-media-note">Ảnh minh họa</span>}
    </header>
  );
}
