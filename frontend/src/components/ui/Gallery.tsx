"use client";

import Image from "next/image";
import { useState } from "react";
import type { MediaImage } from "@/lib/media";
import { GallerySwipe } from "./GallerySwipe";
import { Icon } from "./Icon";
import { Lightbox } from "./Lightbox";

// Grid is 2fr 1fr 1fr inside the 1180px container and hidden at <=640px (see ui.css).
const FIRST_TILE_SIZES = "(max-width: 640px) 1px, (max-width: 1240px) 50vw, 600px";
const TILE_SIZES = "(max-width: 640px) 1px, (max-width: 1240px) 25vw, 300px";

const GRID_TILES = 5;

/**
 * Tablets and desktops: a mosaic of the first five photos (one large, the rest beside it); the last tile shows
 * how many more there are and "Xem tất cả" opens the lightbox. Phones: a swipeable strip with a "1/6" counter
 * (GallerySwipe). CSS shows one of the two; every photo opens the same lightbox.
 */
export function Gallery({ images, title }: { images: MediaImage[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const tiles = images.slice(0, GRID_TILES);
  const hidden = images.length - tiles.length;
  if (tiles.length === 0) return null;

  return (
    <div className="ui-gallery-wrap">
      <div className="ui-gallery">
        {tiles.map((image, index) => (
          <button key={image.src} type="button" className="ui-gallery-tile" onClick={() => setOpen(index)}
            aria-label={`Xem ảnh ${index + 1} trên ${images.length} của ${title} toàn màn hình`}>
            {/* The first tile is the desktop LCP, so it loads eagerly. Phones hide this mosaic: "1px" there makes
                the browser fetch only the smallest variant instead of a full photo nobody sees. */}
            <Image src={image.src} alt={image.alt} fill loading={index === 0 ? "eager" : "lazy"}
              sizes={index === 0 ? FIRST_TILE_SIZES : TILE_SIZES} />
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
      </div>
      <GallerySwipe images={images} title={title} onOpen={setOpen} />
      {open !== null && (
        <Lightbox images={images} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
