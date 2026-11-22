"use client";

import { createContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useResource } from "@/hooks/useResource";
import { isOperator } from "@/lib/auth";
import { getNewServiceRequestCount } from "@/services/admin-service-requests";

export interface NewRequestCount {
  /** Service requests nobody has contacted yet; 0 while loading, on error or for customers. */
  count: number;
  /** Loads the count again, e.g. after staff changed a request's status. */
  refresh: () => void;
}

export const NewRequestCountContext = createContext<NewRequestCount | null>(null);

/**
 * One count for the header badge and the admin menu badge, so a page asks the API once instead of once per badge.
 * Only staff and admins who accepted the terms load it: customers would get 403.
 */
export function NewRequestCountProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const enabled = Boolean(session?.termsAccepted) && isOperator(session?.user);
  // Keyed by user, so signing in as another operator loads that account's view.
  const key = enabled && session ? `admin:new-requests:${session.user.id}` : null;
  const { state, retry } = useResource(key, getNewServiceRequestCount);
  const count = state.status === "ready" ? state.data : 0;
  const value = useMemo(() => ({ count, refresh: retry }), [count, retry]);
  return <NewRequestCountContext.Provider value={value}>{children}</NewRequestCountContext.Provider>;
}
