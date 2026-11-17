import Link from "next/link";
import type { ReactNode } from "react";
import type { ApiError } from "@/lib/api-client";

const NOT_FOUND = 404;

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="sh-state" role="status" aria-busy="true">
      <p>{label}</p>
      <div className="sh-skeleton" aria-hidden="true"><span /><span /><span /></div>
    </div>
  );
}

interface ErrorStateProps {
  error: ApiError;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}

export function ErrorState({ error, onRetry, backHref, backLabel = "Quay lại" }: ErrorStateProps) {
  const missing = error.status === NOT_FOUND;
  return (
    <div className="sh-state" role="alert">
      <h2>{missing ? "Không tìm thấy dữ liệu" : "Chưa tải được dữ liệu"}</h2>
      <p>{error.message}</p>
      <div className="sh-state-actions">
        {onRetry && !missing && <button className="btn btn-primary" onClick={onRetry}>Thử lại</button>}
        {backHref && <Link className="btn btn-outline" href={backHref}>{backLabel}</Link>}
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="sh-state" role="status">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
