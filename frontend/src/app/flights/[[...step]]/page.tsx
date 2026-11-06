import { notFound } from "next/navigation";
import { FlightPage } from "@/components/flights/FlightPage";
import "@/styles/flights.css";

export const metadata = { title: "Vé máy bay nội địa | SàiHành", description: "Tìm và so sánh chuyến bay nội địa, trải nghiệm đặt vé demo cùng SàiHành." };
export default async function Page({ params, searchParams }: {
  params: Promise<{ step?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { step = [] } = await params;
  if (step.length > 1 || (step[0] && !["results", "detail", "booking"].includes(step[0]))) notFound();
  const query = await searchParams;
  const values = Object.fromEntries(Object.entries(query).map(([k, v]) => [k, typeof v === "string" ? v : ""]));
  return <FlightPage key={JSON.stringify([step, values])} step={step[0] || "search"} query={values} />;
}
