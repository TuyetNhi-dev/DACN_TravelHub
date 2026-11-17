"use client";

import { useEffect, useState } from "react";

const TICK_MS = 1000;

function secondsUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.max(0, Math.ceil((Date.parse(deadline) - Date.now()) / TICK_MS));
}

/**
 * Seconds left until a server-provided UTC deadline, ticking every second; null when there is no deadline.
 * Display only: the server re-checks the deadline on every payment.
 */
export function useCountdown(deadline: string | null): number | null {
  const [left, setLeft] = useState(() => secondsUntil(deadline));

  useEffect(() => {
    if (!deadline) return;
    const tick = () => setLeft(secondsUntil(deadline));
    tick();
    const timer = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(timer);
  }, [deadline]);

  return deadline ? left : null;
}

/** 425 → "07:05". */
export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
