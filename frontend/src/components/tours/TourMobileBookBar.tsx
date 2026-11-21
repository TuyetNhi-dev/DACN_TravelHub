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

  function openBooking() {
    const panel = document.getElementById(targetId);
    if (!panel) return;
    panel.scrollIntoView({ block: "start" });
    // Keyboard and screen-reader users land on the form, not back at the top of the page.
    panel.focus({ preventScroll: true });
  }

  return (
    <div className="mobile-book-bar">
      <p>
        <small>Giá từ</small>
        <strong>{formatCurrency(price)}</strong>
      </p>
      <button type="button" className="btn btn-primary" onClick={openBooking} aria-controls={targetId}>
        Đặt ngay
      </button>
    </div>
  );
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
