"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaImage } from "@/lib/media";
import { Icon } from "./Icon";
import { Lightbox } from "./Lightbox";

const GRID_TILES = 5;

/**
 * Mosaic of the first five photos. The last tile shows how many more there are, and "Xem tất cả" opens
 * the lightbox, where every photo can be browsed with arrows, swipes or the thumbnail strip.
 */
export function Gallery({ images, title }: { images: MediaImage[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const tiles = images.slice(0, GRID_TILES);
  const hidden = images.length - tiles.length;
  if (tiles.length === 0) return null;

  return (
    <div className="ui-gallery">
      {tiles.map((image, index) => (
        <button key={image.src} type="button" className="ui-gallery-tile" onClick={() => setOpen(index)}
          aria-label={`Xem ảnh ${index + 1} trên ${images.length} của ${title} toàn màn hình`}>
          <Image src={image.src} alt={image.alt} fill priority={index === 0}
            sizes={index === 0 ? "(max-width: 768px) 100vw, 60vw" : "(max-width: 768px) 50vw, 20vw"} />
          {hidden > 0 && index === tiles.length - 1 && (
            <span className="ui-gallery-more" aria-hidden="true">+{hidden} ảnh</span>
          )}
        </button>
      ))}
      {tiles.some(image => image.illustrative) && <span className="ui-media-note">Ảnh minh họa</span>}
      {images.length > 1 && (
        <button type="button" className="ui-gallery-all" onClick={() => setOpen(0)}>
          <Icon name="eye" size={16} />Xem tất cả {images.length} ảnh
        </button>
      )}
      {open !== null && (
        <Lightbox images={images} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
