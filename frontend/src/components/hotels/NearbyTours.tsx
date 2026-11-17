"use client";

import Link from "next/link";
import { TourCard } from "@/components/home/TourCard";
import { useResource } from "@/hooks/useResource";
import { destinationHref, sameCity } from "@/lib/destinations";
import { getTours } from "@/services/tours";

const MAX_TOURS = 3;

/** Cross-sell like Klook's "things to do nearby": SàiHành tours to the hotel's city. Hidden when none. */
export function NearbyTours({ city }: { city: string }) {
  const { state } = useResource("tours", getTours);
  if (state.status !== "ready") return null;
  const tours = state.data.filter(tour => sameCity(tour.destination, city)).slice(0, MAX_TOURS);
  if (tours.length === 0) return null;
  return (
    <section id="hotel-tours" className="sh-hotel-panel" aria-labelledby="nearby-title">
      <div className="hotel-section-head">
        <h2 id="nearby-title">Trải nghiệm quanh {city}</h2>
        <Link href={destinationHref(city)}>Mọi dịch vụ ở {city}</Link>
      </div>
      <p className="sh-hotel-caption">Kết hợp tour SàiHành với kỳ nghỉ: giữ chỗ ngay, không cần chờ đối tác.</p>
      <div className="hotel-tours">
        {tours.map(tour => <TourCard key={tour.id} tour={tour} />)}
      </div>
    </section>
  );
}
