import { AdminDeparturesPage } from "@/components/admin/departures/AdminDeparturesPage";
import { firstParam, isResourceId } from "@/lib/route-params";

export const metadata = { title: "Lịch khởi hành | SàiHành", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** ?tourId= narrows the list to one tour; anything that is not an id is ignored. */
export default async function AdminDepartures({ searchParams }: { searchParams: SearchParams }) {
  const tourId = firstParam((await searchParams).tourId);
  return <AdminDeparturesPage key={tourId} initialTourId={isResourceId(tourId) ? tourId : ""} />;
}
