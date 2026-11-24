"use client";

import Link from "next/link";
import { useResource } from "@/hooks/useResource";
import { useAdmin } from "@/components/admin/shell/AdminProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { getDashboard } from "@/services/admin-catalog";
import { compactMoney, occupancyText, revenueChange, todoItems } from "@/lib/admin-dashboard";
import type { Dashboard } from "@/types/admin";
import { RevenueChart } from "./RevenueChart";

const MONEY_FORMAT = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND",
  maximumFractionDigits: 0 });
const DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" });

export function AdminDashboard() {
  const { scope, context } = useAdmin();
  const { state, retry } = useResource(`admin:dashboard:${scope}`, signal => getDashboard(scope, signal));

  if (state.status === "loading") return <LoadingState label="Đang tải số liệu tổng quan…" />;
  if (state.status === "error") return <ErrorState error={state.error} onRetry={retry} />;

  const dashboard = state.data;
  return (
    <main id="main-content" className="sh-page adm-page adm-dashboard">
      <DashboardHeader fullName={context.fullName} scope={scope} options={context.scopeOptions} />
      <MetricGrid dashboard={dashboard} />
      <RevenuePanel dashboard={dashboard} />
      <DashboardQueues dashboard={dashboard} />
    </main>
  );
}

function DashboardHeader({ fullName, scope, options }: {
  fullName: string; scope: string; options: { value: string; label: string }[];
}) {
  const today = new Date();
  return <header className="sh-page-head adm-page-head">
    <div><p className="adm-eyebrow">Tổng quan hoạt động</p><h1>Xin chào, {fullName}</h1>
      <p className="adm-note">Số liệu theo phạm vi {scopeLabelFor(options, scope)}.</p></div>
    <time className="adm-dashboard-date" dateTime={today.toISOString().slice(0, 10)}>
      {DATE_FORMAT.format(today)}
    </time>
  </header>;
}

function MetricGrid({ dashboard }: { dashboard: Dashboard }) {
  const change = revenueChange(dashboard.revenueChangePercent);
  const comparison = dashboard.revenueLastMonth === null
    ? "Cần cập nhật backend để so sánh với tháng trước"
    : change.text;
  return <section className="adm-metrics" aria-label="Chỉ số chính">
    <Metric label="Đơn hôm nay" value={dashboard.ordersToday.toLocaleString("vi-VN")} href="/admin/bookings" />
    <Metric label="Doanh thu tháng này" value={MONEY_FORMAT.format(dashboard.revenueThisMonth)}
      note={comparison} trend={dashboard.revenueLastMonth === null ? "none" : change.trend} />
    <Metric label="Đơn chờ xử lý" value={dashboard.pendingItems.toLocaleString("vi-VN")}
      href="/admin/bookings?status=awaiting_supplier" />
    <Metric label="Tỉ lệ lấp đầy 30 ngày" value={dashboard.revenueLastMonth === null
      ? "Cần cập nhật backend" : occupancyText(dashboard.occupancyPercent)}
      href="/admin/departures" />
  </section>;
}

function RevenuePanel({ dashboard }: { dashboard: Dashboard }) {
  const hasHistory = dashboard.revenueLastMonth !== null;
  return <section className="adm-panel" aria-labelledby="revenue-title">
    <div className="adm-panel-head"><div><h2 id="revenue-title">Doanh thu theo khu vực</h2>
      <p className="adm-note">{hasHistory ? "Sáu tháng gần đây" : "Khởi động lại backend để xem lịch sử sáu tháng"}
        · {compactMoney(dashboard.revenueThisMonth)} ₫ tháng này</p></div></div>
    <RevenueChart rows={dashboard.revenueSeries} />
  </section>;
}

function DashboardQueues({ dashboard }: { dashboard: Dashboard }) {
  const todos = todoItems(dashboard.todo);
  return <div className="adm-dashboard-columns">
    <section className="adm-panel" aria-labelledby="todo-title">
      <div className="adm-panel-head"><h2 id="todo-title">Việc cần xử lý</h2></div>
      {todos.length === 0 && dashboard.todo &&
        <EmptyState title="Bạn đã xử lý hết công việc cần ưu tiên." icon="check" />}
      {!dashboard.todo && <p className="adm-note">Cần khởi động lại backend để tải danh sách việc ưu tiên.</p>}
      {todos.length > 0 &&
        <ul className="adm-todo-list">{todos.map(item => <li key={item.href + item.label}>
          <Link href={item.href}>{item.label}<strong>{item.count}</strong></Link>
        </li>)}</ul>}
    </section>
    <UpcomingDepartures rows={dashboard.upcoming} />
  </div>;
}

function UpcomingDepartures({ rows }: { rows: Dashboard["upcoming"] }) {
  return <section className="adm-panel" aria-labelledby="departures-title">
    <div className="adm-panel-head"><h2 id="departures-title">Chuyến sắp khởi hành</h2>
      <Link href="/admin/departures">Xem lịch</Link></div>
    {rows.length === 0 ? <EmptyState title="Chưa có chuyến khởi hành trong 14 ngày tới." icon="calendar" /> :
      <ul className="adm-upcoming-list">{rows.map(item => <li key={item.departureId}>
        <div><strong>{item.tourTitle}</strong><span>
          {DATE_FORMAT.format(new Date(`${item.departureDate}T12:00:00`))} · {item.branchName}
        </span></div>
        <span className={item.belowMinimum ? "adm-seat-count warning" : "adm-seat-count"}>
          {item.reservedSeats}/{item.minGuests} khách tối thiểu
        </span>
      </li>)}</ul>}
  </section>;
}

function Metric({ label, value, href, note, trend }: {
  label: string; value: string; href?: string; note?: string; trend?: string;
}) {
  const content = <><span>{label}</span><strong>{value}</strong>{note && <small data-trend={trend}>{note}</small>}</>;
  return <article className="adm-metric">{href ? <Link href={href}>{content}</Link> : content}</article>;
}

function scopeLabelFor(options: { value: string; label: string }[], scope: string): string {
  return options.find(option => option.value === scope)?.label ?? "phạm vi của bạn";
}
