import { TourList } from "@/components/tours/TourList";
export const metadata = { title: "Tour du lịch | SàiHành" };
export default async function ToursPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 200);
  return <TourList initialQuery={query} />;
}
