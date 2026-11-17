import { LegalPage } from "@/components/legal/LegalPage";
import { privacyPolicy } from "@/data/legal";

export const metadata = { title: "Chính sách bảo mật | SàiHành" };

export default function PrivacyPage() {
  return <LegalPage document={privacyPolicy} />;
}
