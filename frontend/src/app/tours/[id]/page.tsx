import { TourDetail } from "@/components/tours/TourDetail";
export const metadata = { title: "Chi tiết tour | SàiHành" };
export default async function TourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TourDetail key={id} id={id} />;
}
