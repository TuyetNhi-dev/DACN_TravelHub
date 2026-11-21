import { ContentPage } from "@/components/content/ContentPage";
import { dataProtectionPolicy } from "@/data/policies";

export const metadata = { title: "Chính sách bảo vệ dữ liệu cá nhân | SàiHành" };

export default function DataProtectionPage() {
  return <ContentPage document={dataProtectionPolicy} />;
}
