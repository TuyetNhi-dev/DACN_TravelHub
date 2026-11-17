"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

const PAGE_FRACTION = 0.9;
const EDGE_TOLERANCE_PX = 4;

/**
 * Horizontal carousel on native scroll-snap: swipe works on touch, the focused track scrolls with the
 * arrow keys, and the side buttons page through on desktop. No autoplay.
 */
export function Carousel({ label, children }: { label: string; children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const slides = Children.toArray(children);

  const measure = useCallback(() => {
    const element = track.current;
    if (!element) return;
    const start = element.scrollLeft <= EDGE_TOLERANCE_PX;
    const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - EDGE_TOLERANCE_PX;
    setEdges(current => (current.start === start && current.end === end ? current : { start, end }));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, slides.length]);

  function page(direction: 1 | -1) {
    const element = track.current;
    element?.scrollBy({ left: direction * element.clientWidth * PAGE_FRACTION, behavior: "smooth" });
  }

  return (
    <div className="ui-carousel" role="region" aria-roledescription="carousel" aria-label={label}>
      <ul ref={track} className="ui-carousel-track" tabIndex={0} onScroll={measure}
        aria-label={`${label}: dùng phím mũi tên trái phải để cuộn`}>
        {slides.map((slide, index) => (
          <li key={index} className="ui-carousel-slide" aria-roledescription="slide"
            aria-label={`${index + 1} / ${slides.length}`}>
            {slide}
          </li>
        ))}
      </ul>
      <button type="button" className="ui-carousel-arrow ui-carousel-arrow--prev" onClick={() => page(-1)}
        disabled={edges.start} aria-label="Xem mục trước">
        <span className="ui-flip"><Icon name="arrow" size={18} /></span>
      </button>
      <button type="button" className="ui-carousel-arrow ui-carousel-arrow--next" onClick={() => page(1)}
        disabled={edges.end} aria-label="Xem mục tiếp theo">
        <Icon name="arrow" size={18} />
      </button>
    </div>
  );
}
