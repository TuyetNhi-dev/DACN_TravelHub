import { TourCreatePage } from "@/components/admin/tours/TourCreatePage";

export const metadata = { title: "Thêm tour | SàiHành", robots: { index: false, follow: false } };

export default function AdminTourNew() {
  return <TourCreatePage />;
}
