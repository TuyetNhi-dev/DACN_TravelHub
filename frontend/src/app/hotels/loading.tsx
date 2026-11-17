import { LoadingState } from "@/components/ui/StateMessage";

export default function LoadingHotels() {
  return (
    <main id="main-content" className="container sh-page">
      <LoadingState label="Đang mở trang khách sạn…" />
    </main>
  );
}
