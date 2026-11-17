import { LegalPage } from "@/components/legal/LegalPage";
import { termsOfUse } from "@/data/legal";

export const metadata = { title: "Điều khoản sử dụng | SàiHành" };

export default function TermsPage() {
  return <LegalPage document={termsOfUse} />;
}
