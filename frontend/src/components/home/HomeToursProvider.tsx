"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useResource, type Resource } from "@/hooks/useResource";
import { getTours } from "@/services/tours";
import type { TourSummary } from "@/types/tour";

interface HomeTours {
  state: Resource<TourSummary[]>;
  retry: () => void;
}

const HomeToursContext = createContext<HomeTours | null>(null);

/** Several home sections read the tour catalogue; this loads it once for all of them. */
export function HomeToursProvider({ children }: { children: ReactNode }) {
  const { state, retry } = useResource("home:tours", getTours);
  return <HomeToursContext value={{ state, retry }}>{children}</HomeToursContext>;
}

export function useHomeTours(): HomeTours {
  const value = useContext(HomeToursContext);
  if (!value) throw new Error("useHomeTours must be used inside HomeToursProvider");
  return value;
}
