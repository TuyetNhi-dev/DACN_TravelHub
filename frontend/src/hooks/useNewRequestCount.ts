"use client";

import { useResource } from "@/hooks/useResource";
import { getNewServiceRequestCount } from "@/services/admin-service-requests";

/**
 * Service requests nobody has contacted yet. Only loaded for staff and admins (customers would get 403).
 * The count is a hint next to a link that works anyway, so a failed load simply shows nothing.
 */
export function useNewRequestCount(enabled: boolean, refreshKey = ""): number {
  const { state } = useResource(enabled ? `admin:new-requests:${refreshKey}` : null, getNewServiceRequestCount);
  return state.status === "ready" ? state.data : 0;
}
