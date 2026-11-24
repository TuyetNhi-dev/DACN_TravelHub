"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";

interface TourMobileBookBarProps {
  price: number;
  /** id of the booking panel the button scrolls to. */
  targetId: string;
}

/**
 * Phone-only bar (shown by CSS below the two-column breakpoint). It hides once the booking panel is on
 * screen or above it, so it never covers the panel's own submit button or the footer.
 */
export function TourMobileBookBar({ price, targetId }: TourMobileBookBarProps) {
  const panelAhead = usePanelAhead(targetId);
  if (!panelAhead) return null;

  return (
    <div className="mobile-book-bar">
      <p>
        <small>Giá từ</small>
        <strong>{formatCurrency(price)}</strong>
      </p>
      <button type="button" className="btn btn-primary" onClick={() => openBookingPanel(targetId)}
        aria-controls={targetId}>
        Đặt ngay
      </button>
    </div>
  );
}

/**
 * Scrolls to the booking panel and moves focus there, so keyboard and screen-reader users land on the form.
 * With onlyIfHidden, a panel already on screen (the sticky sidebar on wide screens) is left alone.
 */
export function openBookingPanel(targetId: string, onlyIfHidden = false) {
  const panel = document.getElementById(targetId);
  if (!panel) return;
  const { top } = panel.getBoundingClientRect();
  if (onlyIfHidden && top >= 0 && top < window.innerHeight) return;
  panel.scrollIntoView({ block: "start" });
  panel.focus({ preventScroll: true });
}

/** True while the panel is still below the visible area. */
function usePanelAhead(targetId: string): boolean {
  const [ahead, setAhead] = useState(true);
  useEffect(() => {
    const panel = document.getElementById(targetId);
    if (!panel) return;
    const observer = new IntersectionObserver(([entry]) => {
      setAhead(!entry.isIntersecting && entry.boundingClientRect.top > 0);
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [targetId]);
  return ahead;
}
