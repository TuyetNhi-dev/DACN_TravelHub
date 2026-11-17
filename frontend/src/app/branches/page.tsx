import { BranchDirectory } from "@/components/branches/BranchDirectory";

export const metadata = {
  title: "Hệ thống văn phòng | SàiHành",
  description: "Địa chỉ, giờ làm việc và số điện thoại các văn phòng SàiHành trên toàn quốc.",
};

export default function BranchesPage() {
  return <BranchDirectory />;
}
