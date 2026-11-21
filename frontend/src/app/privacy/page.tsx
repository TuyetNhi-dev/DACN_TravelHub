import { ContentPage } from "@/components/content/ContentPage";
import { privacyPolicy } from "@/data/policies";

export const metadata = { title: "Chính sách riêng tư | SàiHành" };

export default function PrivacyPage() {
  return <ContentPage document={privacyPolicy} />;
}
