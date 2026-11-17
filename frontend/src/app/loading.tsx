import { LoadingState } from "@/components/ui/StateMessage";

export default function LoadingPage() {
  return (
    <main id="main-content" className="container sh-page">
      <LoadingState label="Đang tải trang…" />
    </main>
  );
}
