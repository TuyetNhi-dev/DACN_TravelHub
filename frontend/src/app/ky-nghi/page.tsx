import { HolidayBreaksPage } from "@/components/holidays/HolidayBreaksPage";
import "@/styles/holiday-breaks.css";

export const metadata = {
  title: "Kỳ nghỉ lễ | SàiHành",
  description: "Các đợt nghỉ lễ 12 tháng tới và tour có lịch khởi hành vừa từng đợt nghỉ.",
};

export default function KyNghiPage() {
  return <HolidayBreaksPage />;
}
