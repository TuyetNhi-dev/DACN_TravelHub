import { MyBookingsPage } from "@/components/bookings/MyBookingsPage";

export const metadata = { title: "Đơn của tôi | SàiHành", robots: { index: false, follow: false } };

export default function BookingsPage() {
  return <MyBookingsPage />;
}
