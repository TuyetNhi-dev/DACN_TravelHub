import type { Metadata } from "next";
import "@/styles/hotels.css";

export const metadata: Metadata = {
  title: { default: "Khách sạn | SàiHành", template: "%s | SàiHành" },
  description: "Tìm khách sạn trong nước, xem loại phòng và gửi yêu cầu đặt phòng với giá hợp đồng của đối tác.",
};

export default function HotelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
