import Image from "next/image";
import type { ReactNode } from "react";
import type { MediaImage } from "@/lib/media";

export function Card({ as: Tag = "article", className, children }: {
  as?: "article" | "div" | "li";
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={`ui-card${className ? ` ${className}` : ""}`}>{children}</Tag>;
}

interface MediaFrameProps {
  image: MediaImage;
  /** Matches the rendered width so next/image picks the right size, e.g. "(max-width: 640px) 100vw, 33vw". */
  sizes: string;
  ratio?: "wide" | "card" | "portrait" | "square";
  /** Badges placed over the photo (top-left). */
  children?: ReactNode;
}

/** Photo with a fixed aspect ratio, hover zoom and the mandatory "Ảnh minh họa" label when it applies. */
export function MediaFrame({ image, sizes, ratio = "card", children }: MediaFrameProps) {
  return (
    <div className={`ui-media ui-media--${ratio}`}>
      <Image src={image.src} alt={image.alt} fill sizes={sizes} />
      {children && <div className="ui-media-badges">{children}</div>}
      {image.illustrative && <span className="ui-media-note">Ảnh minh họa</span>}
    </div>
  );
}
