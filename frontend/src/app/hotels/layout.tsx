import type { Metadata } from "next";
import "@/styles/hotels.css";

export const metadata: Metadata = {
  title: { default: "Khách sạn | SàiHành", template: "%s | SàiHành" },
  description: "Tìm khách sạn trong nước, xem phòng và tiện nghi, trải nghiệm quy trình đặt phòng demo cùng SàiHành.",
};
export default function HotelsLayout({ children }: { children: React.ReactNode }) { return children; }
