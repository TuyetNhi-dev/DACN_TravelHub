"use client";

import { CollectionStrip } from "@/components/tours/CollectionStrip";
import { useResource } from "@/hooks/useResource";
import { getTourCollections } from "@/services/tours";

/** Seasonal collections right under the hero; renders nothing while loading or on error. */
export function HomeCollections() {
  const { state } = useResource("tour-collections", getTourCollections);
  if (state.status !== "ready") return null;
  return <div className="container home-collections"><CollectionStrip collections={state.data} /></div>;
}
