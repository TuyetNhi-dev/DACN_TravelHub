"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api-client";

export type Resource<T> =
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "ready"; data: T };

interface Settled<T> {
  requestKey: string;
  value: Resource<T>;
}

const LOADING = { status: "loading" } as const;

/**
 * Loads data for `key`, aborting stale requests. State is tagged with the request key, so a new key
 * shows "loading" immediately without resetting state inside the effect.
 */
export function useResource<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>) {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const loader = useRef(load);
  const requestKey = key === null ? null : `${key}#${attempt}`;

  useEffect(() => {
    loader.current = load;
  });

  useEffect(() => {
    if (requestKey === null) return;
    const controller = new AbortController();
    loader.current(controller.signal)
      .then(data => ({ status: "ready", data }) as const)
      .catch((error: unknown) => ({ status: "error", error: toApiError(error) }) as const)
      .then(value => { if (!controller.signal.aborted) setSettled({ requestKey, value }); });
    return () => controller.abort();
  }, [requestKey]);

  const retry = useCallback(() => setAttempt(value => value + 1), []);
  const replace = useCallback((data: T) => {
    if (requestKey !== null) setSettled({ requestKey, value: { status: "ready", data } });
  }, [requestKey]);

  const state: Resource<T> = settled && settled.requestKey === requestKey ? settled.value : LOADING;
  return { state, retry, replace };
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError("Không thể tải dữ liệu. Vui lòng thử lại.");
}
