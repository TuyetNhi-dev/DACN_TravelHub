"use client";

import type { ReactNode } from "react";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useRequireSession } from "@/hooks/useRequireSession";
import { ApiError } from "@/lib/api-client";
import { isOperator } from "@/lib/auth";

const FORBIDDEN = 403;

/** Hides back-office screens from customers. The API enforces the same rule on every request. */
export function OperatorGate({ children }: { children: ReactNode }) {
  const { session, loading, error, refresh } = useRequireSession();
  if (error) return <ErrorState error={new ApiError(error)} onRetry={() => void refresh()} />;
  if (loading || !session) return <LoadingState label="Đang kiểm tra quyền truy cập…" />;
  if (!isOperator(session.user)) {
    return (
      <ErrorState backHref="/" backLabel="Về trang chủ"
        error={new ApiError("Tài khoản của bạn không có quyền truy cập trang quản trị.", FORBIDDEN)} />
    );
  }
  return children;
}
