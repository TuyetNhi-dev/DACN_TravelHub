import { ContentPage } from "@/components/content/ContentPage";
import { termsOfUse } from "@/data/policies";

export const metadata = { title: "Thỏa thuận sử dụng | SàiHành" };

export default function TermsPage() {
  return <ContentPage document={termsOfUse} />;
}
