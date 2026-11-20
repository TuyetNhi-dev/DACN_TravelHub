import { Suspense } from "react";
import { ServiceRequestsAdminPage } from "@/components/admin/ServiceRequestsAdminPage";
import { LoadingState } from "@/components/ui/StateMessage";

export const metadata = { title: "Yêu cầu tư vấn | SàiHành", robots: { index: false, follow: false } };

export default function AdminServiceRequests() {
  // The list reads its filter from the URL (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense fallback={<main className="container sh-page"><LoadingState label="Đang tải…" /></main>}>
      <ServiceRequestsAdminPage />
    </Suspense>
  );
}
