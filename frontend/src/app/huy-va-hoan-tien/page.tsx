import { ContentPage } from "@/components/content/ContentPage";
import { cancellationPolicy } from "@/data/policies";

export const metadata = { title: "Chính sách hủy & hoàn tiền | SàiHành" };

export default function CancellationPage() {
  return <ContentPage document={cancellationPolicy} />;
}
