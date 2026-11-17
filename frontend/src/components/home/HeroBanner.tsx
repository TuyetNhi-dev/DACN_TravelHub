"use client";

import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { heroSlides, type HeroSlide } from "@/data/home";
import { getDestinationImages } from "@/lib/media";
import { HeroDeck } from "./HeroDeck";
import { HeroPager } from "./HeroPager";

const SLIDE_DURATION_MS = 7000;
const TOTAL = heroSlides.length;

export function HeroBanner() {
  const [index, setIndex] = useState(0);
  // Keyboard focus pauses the slideshow so focused content does not change under the user.
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const slide = heroSlides[index];

  // Parallax writes CSS variables directly so mouse movement never re-renders React.
  function track(event: MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    root.current?.style.setProperty("--mx", ((event.clientX - box.left) / box.width - 0.5).toFixed(3));
    root.current?.style.setProperty("--my", ((event.clientY - box.top) / box.height - 0.5).toFixed(3));
  }

  return (
    <div
      ref={root}
      className={`hero-immersive${focused || stopped ? " is-paused" : ""}`}
      style={{ "--slide-duration": `${SLIDE_DURATION_MS}ms` } as CSSProperties}
      onMouseMove={track}
      onFocus={event => setFocused(event.target.matches(":focus-visible"))}
      onBlur={() => setFocused(false)}
    >
      <HeroBackdrop index={index} />
      <span key={`ghost-${slide.place}`} className="hero-ghost" aria-hidden="true">{slide.place}</span>
      <svg className="hero-route" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-20 170 C 300 20, 760 10, 1220 90" />
        <g className="hero-route-plane"><path d="M-12 -6 L14 0 L-12 6 L-6 0 Z" /></g>
      </svg>

      <div className="container hero-stage">
        <div className="hero-copy-col">
          <HeroCopy slide={slide} />
          <HeroPager index={index} paused={stopped}
            onPrev={() => setIndex(current => (current - 1 + TOTAL) % TOTAL)}
            onNext={() => setIndex(current => (current + 1) % TOTAL)}
            onTogglePause={() => setStopped(!stopped)} />
        </div>
        <div className="hero-side">
          <div className="hero-glass">
            <span className="deal-icon"><Icon name="ticket" /></span>
            <span><b>Giữ chỗ tour tức thì</b><small>Khách sạn, vé máy bay ghi rõ giá tham khảo</small></span>
          </div>
          <HeroDeck index={index} onSelect={setIndex} />
        </div>
      </div>
    </div>
  );
}

function HeroBackdrop({ index }: { index: number }) {
  return (
    <div className="hero-backdrop">
      {heroSlides.map((item, i) => (
        // Decorative: the headline already names the destination.
        <Image key={item.place} src={getDestinationImages(item.place)[0].src} alt="" fill sizes="100vw"
          priority={i === 0} className={i === index ? "is-active" : ""} />
      ))}
      <span className="hero-shade" />
    </div>
  );
}

function HeroCopy({ slide }: { slide: HeroSlide }) {
  return (
    <div className="hero-copy-panel" key={slide.place}>
      <span className="hero-eyebrow">
        <span className="hero-eyebrow-line" />
        {slide.region} · Việt Nam
      </span>
      <h1 aria-label={`Khám phá ${slide.place}`}>
        <span className="hero-lead">Khám phá</span>
        <span className="hero-title" aria-hidden="true">
          {Array.from(slide.place).map((char, i) => (
            <span key={i} style={{ "--i": i } as CSSProperties}>{char === " " ? " " : char}</span>
          ))}
        </span>
      </h1>
      <p className="hero-desc">{slide.tagline}</p>
      <div className="hero-actions">
        <Link className="btn btn-primary btn-large hero-shine" href={`/tours?q=${encodeURIComponent(slide.query)}`}>
          Xem tour {slide.place} <Icon name="arrow" />
        </Link>
        <Link className="btn btn-large hero-ghost-btn" href={`/hotels?q=${encodeURIComponent(slide.query)}`}>
          <Icon name="hotel" size={18} /> Khách sạn
        </Link>
      </div>
    </div>
  );
}
