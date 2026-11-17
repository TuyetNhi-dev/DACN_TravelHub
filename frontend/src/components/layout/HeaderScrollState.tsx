"use client";

import { useEffect, useRef } from "react";

const SCROLLED_AFTER_PX = 24;

/** Marks the sticky header once the page scrolls, so CSS can deepen its shadow. Touches the DOM only. */
export function HeaderScrollState() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = marker.current?.closest("header");
    if (!header) return;
    const update = () => header.classList.toggle("is-scrolled", window.scrollY > SCROLLED_AFTER_PX);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return <span ref={marker} hidden />;
}
