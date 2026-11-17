import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost" | "glass" | "white";
export type ButtonSize = "sm" | "md" | "lg";

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function buttonClass({ variant = "primary", size = "md" }: StyleProps, extra?: string): string {
  return ["btn", `btn-${variant}`, size === "md" ? "" : `btn-${size === "lg" ? "large" : "small"}`, extra]
    .filter(Boolean).join(" ");
}

interface ButtonProps extends StyleProps, ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  variant, size, loading = false, loadingLabel = "Đang xử lý…", className, children, disabled, ...rest
}: ButtonProps) {
  return (
    <button type="button" {...rest} className={buttonClass({ variant, size }, className)}
      disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading ? <><span className="btn-spinner" aria-hidden="true" />{loadingLabel}</> : children}
    </button>
  );
}

interface ButtonLinkProps extends StyleProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({ href, variant, size, className, children }: ButtonLinkProps) {
  return <Link href={href} className={buttonClass({ variant, size }, className)}>{children}</Link>;
}
