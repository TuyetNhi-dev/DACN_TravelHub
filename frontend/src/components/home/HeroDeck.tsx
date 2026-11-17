"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { heroSlides } from "@/data/home";
import { getDestinationImages } from "@/lib/media";

const VISIBLE_CARDS = 3;

/**
 * Fanned stack of the upcoming destinations. Cards keep stable keys, so when the slide changes
 * React moves them and CSS animates each card to its new position in the stack.
 */
export function HeroDeck({ index, onSelect }: { index: number; onSelect: (index: number) => void }) {
  const total = heroSlides.length;
  return (
    <div className="hero-deck" role="group" aria-label="Điểm đến tiếp theo">
      {heroSlides.map((slide, slideIndex) => {
        const position = (slideIndex - index - 1 + total) % total;
        const hidden = position >= VISIBLE_CARDS;
        return (
          <button
            key={slide.place}
            type="button"
            className={`hero-card${hidden ? " is-hidden" : ""}`}
            style={{ "--pos": position } as CSSProperties}
            tabIndex={hidden ? -1 : 0}
            aria-hidden={hidden}
            aria-label={`Xem ${slide.place}`}
            onClick={() => onSelect(slideIndex)}
          >
            <Image src={getDestinationImages(slide.place)[0].src} alt="" fill sizes="200px" />
            <span className="hero-card-body">
              <small>{String(slideIndex + 1).padStart(2, "0")} · {slide.region}</small>
              <b>{slide.place}</b>
            </span>
            <span className="hero-card-go" aria-hidden="true"><Icon name="arrow" size={16} /></span>
          </button>
        );
      })}
    </div>
  );
}
