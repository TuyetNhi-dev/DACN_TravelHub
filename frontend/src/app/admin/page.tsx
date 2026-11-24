import { AdminDashboard } from "@/components/admin/dashboard/AdminDashboard";

export const metadata = { title: "Tổng quan | SàiHành", robots: { index: false, follow: false } };

export default function AdminIndexPage() {
  return <AdminDashboard />;
}
