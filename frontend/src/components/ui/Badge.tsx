import type { ReactNode } from "react";

export type BadgeTone = "info" | "success" | "warning" | "danger" | "neutral" | "brand" | "image";

/** "image" sits on top of photos (dark glass), the other tones on page surfaces. */
export function Badge({ tone = "neutral", children, className }: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={`sh-badge sh-badge--${tone}${className ? ` ${className}` : ""}`}>{children}</span>;
}
