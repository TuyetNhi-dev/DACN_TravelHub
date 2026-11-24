/** Pure helpers of the admin dashboard: chart scale and series, wording of the cards, the to-do list. */
import type { DashboardTodo, MonthRevenue } from "@/types/admin";

const TICK_COUNT = 4;
const NICE_STEPS = [1, 2, 2.5, 5, 10];
const BILLION = 1_000_000_000;
const MILLION = 1_000_000;
const THOUSAND = 1_000;

/** The smallest "round" number ≥ value (1, 2, 2.5 or 5 × 10ⁿ), so axis ticks read well. 0 stays 0. */
export function niceMax(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = NICE_STEPS.find(s => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

export interface ChartSeries {
  code: string;
  name: string;
  values: number[];
}

export interface RevenueChartModel {
  months: string[];
  series: ChartSeries[];
  max: number;
  ticks: number[];
}

/** One series per region (first-seen order) with a value for every month, missing months counting as 0. */
export function revenueChart(rows: MonthRevenue[]): RevenueChartModel {
  const names = new Map<string, string>();
  for (const month of rows) for (const region of month.regions) if (!names.has(region.code))
    names.set(region.code, region.name);
  const series = [...names].map(([code, name]) => ({
    code, name, values: rows.map(month => month.regions.find(r => r.code === code)?.revenue ?? 0),
  }));
  const max = niceMax(Math.max(0, ...series.flatMap(s => s.values)));
  const ticks = max === 0 ? [0] : Array.from({ length: TICK_COUNT + 1 }, (_, i) => (max / TICK_COUNT) * i);
  return { months: rows.map(month => month.month), series, max, ticks };
}

/** "2026-11" → "T11/2026" (short: "T11"). */
export function monthLabel(month: string, short = false): string {
  const [year, number] = month.split("-");
  return short ? `T${Number(number)}` : `T${Number(number)}/${year}`;
}

/** Axis labels: "1,2 tỷ", "350 tr", "800 N", "0". */
export function compactMoney(value: number): string {
  const format = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  if (value >= BILLION) return `${format(value / BILLION)} tỷ`;
  if (value >= MILLION) return `${format(value / MILLION)} tr`;
  if (value >= THOUSAND) return `${format(value / THOUSAND)} N`;
  return format(value);
}

export interface ChangeText {
  text: string;
  trend: "up" | "down" | "flat" | "none";
}

export function revenueChange(percent: number | null): ChangeText {
  if (percent === null) return { text: "Tháng trước chưa có doanh thu để so sánh", trend: "none" };
  const value = Math.abs(percent).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
  if (percent > 0) return { text: `Tăng ${value}% so với tháng trước`, trend: "up" };
  if (percent < 0) return { text: `Giảm ${value}% so với tháng trước`, trend: "down" };
  return { text: "Bằng tháng trước", trend: "flat" };
}

export function occupancyText(percent: number | null): string {
  return percent === null ? "Chưa có lịch mở bán" : `${percent.toLocaleString("vi-VN")}%`;
}

export interface TodoItem {
  label: string;
  count: number;
  href: string;
}

/** Only items with something to do; each links to the list filtered on it. */
export function todoItems(todo: DashboardTodo | null): TodoItem[] {
  if (!todo) return [];
  return [
    { label: "Đơn chờ đối tác quá 24 giờ", count: todo.overduePendingItems,
      href: "/admin/bookings?status=awaiting_supplier" },
    { label: "Yêu cầu dịch vụ mới chưa liên hệ", count: todo.newServiceRequests,
      href: "/admin/service-requests?trang-thai=new" },
    { label: "Chuyến 14 ngày tới chưa đủ khách tối thiểu", count: todo.departuresBelowMinimum,
      href: "/admin/departures?view=table" },
  ].filter(item => item.count > 0);
}
