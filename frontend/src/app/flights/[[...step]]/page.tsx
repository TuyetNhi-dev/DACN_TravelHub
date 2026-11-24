import { notFound } from "next/navigation";
import { FlightBookingPage } from "@/components/flights/FlightBookingPage";
import { FlightPage } from "@/components/flights/FlightPage";
import { parseFlightSearch } from "@/lib/flight-search";
import { firstParam, isResourceId } from "@/lib/route-params";
import "@/styles/flights.css";
import "@/styles/flight-prices.css";

export const metadata = {
  title: "Vé máy bay nội địa | SàiHành",
  description: "So sánh giá vé hợp đồng các chặng bay nội địa và gửi yêu cầu đặt vé cùng SàiHành.",
};

const BOOKING_STEP = "booking";

type Params = Promise<{ step?: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Serves /flights (search and results) and /flights/booking?offer=… (passenger details). */
export default async function FlightsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ step = [] }, query] = await Promise.all([params, searchParams]);
  const values = Object.fromEntries(Object.entries(query).map(([key, value]) => [key, firstParam(value)]));
  const search = parseFlightSearch(values);
  if (step.length === 0) return <FlightPage key={JSON.stringify(search)} search={search} />;
  if (step.length === 1 && step[0] === BOOKING_STEP && isResourceId(values.offer ?? "")) {
    const returnOfferId = search.returnDate && isResourceId(values.returnOffer ?? "") ? values.returnOffer : undefined;
    return (
      <FlightBookingPage key={`${values.offer}:${returnOfferId ?? ""}`} search={search} offerId={values.offer}
        returnOfferId={returnOfferId} />
    );
  }
  notFound();
}
