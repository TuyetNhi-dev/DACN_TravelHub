"use client";

import { Icon } from "@/components/ui/Icon";
import { heroSlides } from "@/data/home";

interface HeroPagerProps {
  index: number;
  paused: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePause: () => void;
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Counter, progress line and controls. The progress animation drives autoplay, so the pause button,
 * keyboard focus and prefers-reduced-motion all stop the slideshow at the same point.
 */
export function HeroPager({ index, paused, onPrev, onNext, onTogglePause }: HeroPagerProps) {
  return (
    <div className="hero-pager">
      <span className="hero-pager-count" aria-live="polite">
        <b key={index}>{pad(index + 1)}</b> / {pad(heroSlides.length)}
      </span>
      <span className="hero-pager-track" aria-hidden="true">
        <span key={index} className="hero-pager-fill" onAnimationEnd={onNext} />
      </span>
      <button type="button" className="hero-round" onClick={onPrev} aria-label="Điểm đến trước">
        <span className="hero-flip"><Icon name="arrow" size={18} /></span>
      </button>
      <button type="button" className="hero-round" onClick={onNext} aria-label="Điểm đến tiếp theo">
        <Icon name="arrow" size={18} />
      </button>
      <button type="button" className="hero-round" onClick={onTogglePause}
        aria-label={paused ? "Tiếp tục trình chiếu" : "Tạm dừng trình chiếu"}>
        <span className="hero-pause-glyph" aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
      </button>
    </div>
  );
}
