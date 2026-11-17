import { FlightDealsPage } from "@/components/flights/FlightDealsPage";
import { dealOrigin } from "@/lib/flight-deals";
import { firstParam } from "@/lib/route-params";
import "@/styles/flights.css";
import "@/styles/flight-deals.css";

export const metadata = {
  title: "Săn vé máy bay giá rẻ | SàiHành",
  description: "Giá vé tham khảo thấp nhất hiện có theo từng chặng bay nội địa trong 30 ngày tới.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FlightDealsRoute({ searchParams }: { searchParams: SearchParams }) {
  const origin = dealOrigin(firstParam((await searchParams).from));
  return <FlightDealsPage key={origin} origin={origin} />;
}
