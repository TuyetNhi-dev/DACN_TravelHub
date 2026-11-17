"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { BRANCH_ZOOM, VIETNAM_CENTER, VIETNAM_ZOOM } from "@/lib/branches";
import type { LocatedBranch } from "@/types/branch";

type LeafletModule = typeof Leaflet;

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>";
const MAX_ZOOM = 19;
const SINGLE_BRANCH_ZOOM = 13;
const FIT_PADDING: [number, number] = [40, 40];
const FLY_SECONDS = 0.8;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

interface BranchMapProps {
  branches: LocatedBranch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Leaflet touches `window`, so it is imported only in the browser, after mount. */
export function BranchMap({ branches, selectedId, onSelect }: BranchMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const leaflet = useRef<LeafletModule | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>());
  const select = useRef(onSelect);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    select.current = onSelect;
  });

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then(module => {
      if (cancelled || !container.current) return;
      leaflet.current = module.default;
      map.current = createMap(module.default, container.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leaflet.current;
    const instance = map.current;
    if (!ready || !L || !instance) return;
    const layer = L.layerGroup().addTo(instance);
    markers.current = new Map(branches.map(branch => [branch.id,
      createMarker(L, branch, () => select.current(branch.id)).addTo(layer)]));
    fitBranches(L, instance, branches);
    return () => {
      layer.remove();
      markers.current = new Map();
    };
  }, [ready, branches]);

  useEffect(() => {
    const L = leaflet.current;
    if (!ready || !L) return;
    markers.current.forEach((marker, id) => marker.setIcon(pinIcon(L, id === selectedId)));
    const marker = selectedId ? markers.current.get(selectedId) : undefined;
    if (marker && map.current) focusMarker(map.current, marker);
  }, [ready, branches, selectedId]);

  return <div ref={container} className="branch-map" role="region" aria-label="Bản đồ văn phòng SàiHành" />;
}

function createMap(L: LeafletModule, element: HTMLElement): Leaflet.Map {
  // Scroll-wheel zoom stays off so the page scrolls normally over the map.
  const instance = L.map(element, { scrollWheelZoom: false }).setView(VIETNAM_CENTER, VIETNAM_ZOOM);
  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(instance);
  return instance;
}

function pinIcon(L: LeafletModule, active: boolean): Leaflet.DivIcon {
  return L.divIcon({
    className: active ? "branch-pin is-active" : "branch-pin",
    html: "<span></span>",
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  });
}

function createMarker(L: LeafletModule, branch: LocatedBranch, onClick: () => void): Leaflet.Marker {
  return L.marker([branch.latitude, branch.longitude], {
    icon: pinIcon(L, false), title: branch.name, alt: branch.name, keyboard: true,
  }).bindPopup(popupContent(branch)).on("click", onClick);
}

/** Built from text nodes, never an HTML string, so API values cannot inject markup. */
function popupContent(branch: LocatedBranch): HTMLElement {
  const root = document.createElement("div");
  root.className = "branch-popup";
  const title = document.createElement("strong");
  title.textContent = branch.name;
  root.append(title);
  if (branch.address) {
    const address = document.createElement("span");
    address.textContent = branch.address;
    root.append(address);
  }
  return root;
}

function fitBranches(L: LeafletModule, instance: Leaflet.Map, branches: LocatedBranch[]) {
  if (branches.length === 0) instance.setView(VIETNAM_CENTER, VIETNAM_ZOOM);
  else if (branches.length === 1)
    instance.setView([branches[0].latitude, branches[0].longitude], SINGLE_BRANCH_ZOOM);
  else
    instance.fitBounds(L.latLngBounds(branches.map(b => [b.latitude, b.longitude])), { padding: FIT_PADDING });
}

function focusMarker(instance: Leaflet.Map, marker: Leaflet.Marker) {
  const reduced = window.matchMedia(REDUCED_MOTION).matches;
  if (reduced) instance.setView(marker.getLatLng(), BRANCH_ZOOM);
  else instance.flyTo(marker.getLatLng(), BRANCH_ZOOM, { duration: FLY_SECONDS });
  marker.openPopup();
}
