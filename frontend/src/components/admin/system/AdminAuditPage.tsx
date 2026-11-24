"use client";

import { useState } from "react";
import { ErrorState, EmptyState, LoadingState } from "@/components/ui/StateMessage";
import { Pagination } from "@/components/ui/Pagination";
import { useAdmin } from "@/components/admin/shell/AdminProvider";
import { useResource } from "@/hooks/useResource";
import { AUDIT_ACTIONS, AUDIT_ENTITIES, entityLabel } from "@/lib/admin-labels";
import { formatDateTime } from "@/lib/format";
import { getAuditActors, getAuditLogs, type AuditFilter } from "@/services/admin-system";
import type { AuditLog } from "@/types/admin";
import { ApiError } from "@/lib/api-client";

const PAGE_SIZE = 30;
const EMPTY_FILTER: AuditFilter = { entityType: "", action: "", actorId: "", from: "", to: "", page: 1 };
const FORBIDDEN = 403;

export function AdminAuditPage() {
  const { context, scope } = useAdmin();
  const allowed = context.capabilities.viewAudit;
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const logs = useResource(allowed ? `admin:audit:${scope}:${JSON.stringify(filter)}` : null,
    signal => getAuditLogs(filter, scope, signal));
  const actors = useResource(allowed ? `admin:audit-actors:${scope}` : null,
    signal => getAuditActors(scope, signal));
  const update = (patch: Partial<AuditFilter>) => setFilter(current => ({ ...current, ...patch, page: 1 }));

  if (!allowed) return <ErrorState error={new ApiError("Bạn không có quyền xem nhật ký thao tác.", FORBIDDEN)} />;
  return <main id="main-content" className="sh-page adm-page">
    <header className="sh-page-head"><span className="kicker">QUẢN TRỊ · HỆ THỐNG</span>
      <h1>Nhật ký thao tác</h1><p>Tra cứu các thay đổi đã được ghi nhận trong phạm vi đang chọn.</p>
    </header>
    <AuditFilters filter={filter} actors={actors.state.status === "ready" ? actors.state.data : []} onChange={update} />
    {actors.state.status === "error" && <ErrorState error={actors.state.error} onRetry={actors.retry} />}
    {logs.state.status === "loading" && <LoadingState label="Đang tải nhật ký…" />}
    {logs.state.status === "error" && <ErrorState error={logs.state.error} onRetry={logs.retry} />}
    {logs.state.status === "ready" && logs.state.data.items.length === 0 &&
      <EmptyState title="Không có thao tác phù hợp bộ lọc." />}
    {logs.state.status === "ready" && logs.state.data.items.length > 0 && <>
      <AuditTable rows={logs.state.data.items} />
      <Pagination page={filter.page} pageCount={Math.max(1, Math.ceil(logs.state.data.total / PAGE_SIZE))}
        label="Trang nhật ký thao tác" onChange={page => setFilter(current => ({ ...current, page }))} />
    </>}
  </main>;
}

function AuditFilters({ filter, actors, onChange }: {
  filter: AuditFilter; actors: { id: string; fullName: string }[]; onChange: (patch: Partial<AuditFilter>) => void;
}) {
  return <div className="sh-toolbar adm-audit-filters" role="search" aria-label="Lọc nhật ký thao tác">
    <label className="sh-field">Loại đối tượng<select value={filter.entityType}
      onChange={event => onChange({ entityType: event.target.value })}>
      <option value="">Tất cả</option>{AUDIT_ENTITIES.map(item =>
        <option key={item.value} value={item.value}>{item.label}</option>)}
    </select></label>
    <label className="sh-field">Hành động<select value={filter.action}
      onChange={event => onChange({ action: event.target.value })}>
      <option value="">Tất cả</option>{AUDIT_ACTIONS.map(item =>
        <option key={item.value} value={item.value}>{item.label}</option>)}
    </select></label>
    <label className="sh-field">Người thao tác<select value={filter.actorId}
      onChange={event => onChange({ actorId: event.target.value })}>
      <option value="">Tất cả</option>{actors.map(actor =>
        <option key={actor.id} value={actor.id}>{actor.fullName}</option>)}
    </select></label>
    <label className="sh-field">Từ ngày<input type="date" value={filter.from}
      onChange={event => onChange({ from: event.target.value })} /></label>
    <label className="sh-field">Đến ngày<input type="date" value={filter.to}
      onChange={event => onChange({ to: event.target.value })} /></label>
  </div>;
}

function AuditTable({ rows }: { rows: AuditLog[] }) {
  return <div className="sh-table-wrap"><table className="sh-table sh-table--cards">
    <caption className="sr-only">Nhật ký thao tác của nhân viên</caption>
    <thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Hành động</th>
      <th>Đối tượng</th><th>Nội dung</th></tr></thead>
    <tbody>{rows.map(row => <tr key={row.id}>
      <td data-label="Thời gian">{formatDateTime(row.createdAt)}</td>
      <td data-label="Người thao tác">{row.actorName}</td>
      <td data-label="Hành động">{actionLabel(row.action)}</td>
      <td data-label="Đối tượng">
        {entityLabel(row.entityType)}<small>{row.branchName ?? "Toàn quốc"}</small>
      </td>
      <td data-label="Nội dung"><AuditSummary row={row} /></td>
    </tr>)}</tbody>
  </table></div>;
}

function AuditSummary({ row }: { row: AuditLog }) {
  return <div className="adm-audit-summary"><span>{row.summary}</span>
    {row.changes.length > 0 && <details><summary>Xem thay đổi ({row.changes.length})</summary>
      <ul>{row.changes.map((change, index) => <li key={`${change.field}-${index}`}>
        <strong>{change.field}</strong>: {change.old ?? "—"} → {change.new ?? "—"}
      </li>)}</ul>
    </details>}
  </div>;
}

function actionLabel(code: string): string {
  return AUDIT_ACTIONS.find(action => action.value === code)?.label ?? code;
}
