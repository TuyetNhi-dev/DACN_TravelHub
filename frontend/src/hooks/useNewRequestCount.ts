"use client";

import { useContext } from "react";
import { NewRequestCountContext, type NewRequestCount } from "@/components/admin/NewRequestCountProvider";

/**
 * The shared "new service requests" count. The count is a hint next to a link that works anyway,
 * so a failed load simply shows nothing.
 */
export function useNewRequestCount(): NewRequestCount {
  const value = useContext(NewRequestCountContext);
  if (!value) throw new Error("NewRequestCountProvider is required");
  return value;
}
