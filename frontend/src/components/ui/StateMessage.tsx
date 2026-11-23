import Link from "next/link";
import type { ReactNode } from "react";
import type { ApiError } from "@/lib/api-client";
import { Icon, type IconName } from "./Icon";

const NOT_FOUND = 404;

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="sh-state sh-state--loading" role="status" aria-busy="true">
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
    <div className="sh-state sh-state--error" role="alert">
      <StateIcon name="alert" />
      <h2>{missing ? "Không tìm thấy dữ liệu" : "Chưa tải được dữ liệu"}</h2>
      <p>{error.message}</p>
      <div className="sh-state-actions">
        {onRetry && !missing && <button className="btn btn-primary" onClick={onRetry}>Thử lại</button>}
        {backHref && <Link className="btn btn-outline" href={backHref}>{backLabel}</Link>}
      </div>
    </div>
  );
}

/** Round icon at the top of a state block; decorative, the heading carries the meaning. */
function StateIcon({ name }: { name: IconName }) {
  return <span className="sh-state-icon" aria-hidden="true"><Icon name={name} size={22} /></span>;
}

export function EmptyState({ title, icon = "compass", children }: {
  title: string;
  icon?: IconName;
  children?: ReactNode;
}) {
  return (
    <div className="sh-state sh-state--empty" role="status">
      <StateIcon name={icon} />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
