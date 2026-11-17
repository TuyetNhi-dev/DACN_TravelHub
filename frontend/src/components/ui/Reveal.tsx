"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const VISIBLE_THRESHOLD = 0.15;

/**
 * Fades its content up once when it scrolls into view. Children marked `data-reveal-item` are staggered.
 * Motion is CSS-only and disabled under prefers-reduced-motion; a <noscript> rule in the layout keeps
 * content visible without JavaScript.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: VISIBLE_THRESHOLD });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
