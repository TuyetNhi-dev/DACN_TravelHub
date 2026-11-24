"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { MediaImage } from "@/lib/media";

// The strip is shown only on phones (<=640px); wider screens would fetch the smallest variant for nothing.
const SLIDE_SIZES = "(min-width: 641px) 1px, 100vw";

interface GallerySwipeProps {
  images: MediaImage[];
  title: string;
  onOpen: (index: number) => void;
}

/**
 * Phone gallery: one photo per screen on native scroll-snap, so a finger swipe pages through and the browser
 * handles momentum. Each slide has a fixed aspect ratio, so lazy photos never make the page jump.
 */
export function GallerySwipe({ images, title, onOpen }: GallerySwipeProps) {
  const track = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);

  function onScroll() {
    const element = track.current;
    if (!element || element.clientWidth === 0) return;
    setCurrent(Math.round(element.scrollLeft / element.clientWidth));
  }

  return (
    <div className="ui-swipe">
      <ul ref={track} className="ui-swipe-track" onScroll={onScroll} aria-label={`Ảnh ${title}, vuốt ngang để xem`}>
        {images.map((image, index) => (
          <li key={image.src} className="ui-swipe-slide">
            <button type="button" onClick={() => onOpen(index)}
              aria-label={`Ảnh ${index + 1} trên ${images.length}: ${image.alt}. Mở toàn màn hình`}>
              <Image src={image.src} alt="" fill loading={index === 0 ? "eager" : "lazy"}
                sizes={SLIDE_SIZES} />
            </button>
          </li>
        ))}
      </ul>
      <span className="ui-swipe-count" aria-hidden="true">{current + 1}/{images.length}</span>
      {images.some(image => image.illustrative) && <span className="ui-media-note">Ảnh minh họa</span>}
    </div>
  );
}
