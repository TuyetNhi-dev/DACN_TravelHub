"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useResource } from "@/hooks/useResource";
import { SCOPE_STORAGE_KEY, validScope } from "@/lib/admin-forms";
import { getAdminContext } from "@/services/admin-catalog";
import type { AdminContext } from "@/types/admin";

interface AdminState {
  context: AdminContext;
  /** The top-bar choice sent as "scope" to every admin list; the server checks it against the roles. */
  scope: string;
  scopeLabel: string;
  setScope: (value: string) => void;
}

const AdminStateContext = createContext<AdminState | null>(null);

function readSaved(): string | null {
  try {
    return window.localStorage.getItem(SCOPE_STORAGE_KEY);
  } catch {
    return null; // Storage blocked: the choice simply lasts for this visit.
  }
}

function save(value: string) {
  try {
    window.localStorage.setItem(SCOPE_STORAGE_KEY, value);
  } catch {
    // Storage blocked: keep the in-memory choice only.
  }
}

/** Loads who the operator is and what they may do; renders the admin pages once that is known. */
export function AdminProvider({ children }: { children: ReactNode }) {
  const { state, retry } = useResource("admin:context", getAdminContext);
  const [saved, setSaved] = useState<string | null>(readSaved);
  const setScope = useCallback((value: string) => {
    setSaved(value);
    save(value);
  }, []);
  const value = useMemo<AdminState | null>(() => {
    if (state.status !== "ready") return null;
    const scope = validScope(saved, state.data.scopeOptions);
    const label = state.data.scopeOptions.find(option => option.value === scope)?.label ?? "";
    return { context: state.data, scope, scopeLabel: label, setScope };
  }, [state, saved, setScope]);
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} backHref="/" />;
  if (!value) return <LoadingState label="Đang tải quyền quản trị…" />;
  return <AdminStateContext.Provider value={value}>{children}</AdminStateContext.Provider>;
}

export function useAdmin(): AdminState {
  const value = useContext(AdminStateContext);
  if (!value) throw new Error("AdminProvider is required");
  return value;
}
