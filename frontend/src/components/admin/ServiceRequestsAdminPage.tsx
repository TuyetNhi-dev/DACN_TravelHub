"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { EXTRA_SERVICES, serviceOfType } from "@/data/extra-services";
import { useResource } from "@/hooks/useResource";
import { formatDateTime } from "@/lib/format";
import {
  EMPTY_FILTER, MAX_QUERY_LENGTH, STATUS_META, changeFilter, hasActiveFilter, pageCount, readFilter, statusMeta,
  writeFilter, type AdminRequestFilter,
} from "@/lib/service-request-admin";
import { getAdminServiceRequests } from "@/services/admin-service-requests";
import {
  SERVICE_REQUEST_STATUSES, type ServiceRequestStatus, type ServiceRequestSummary, type ServiceRequestType,
} from "@/types/service-request";

export function ServiceRequestsAdminPage() {
  return (
    <main id="main-content" className="sh-page adm-page">
      <div className="sh-page-head">
        <span className="kicker">QUẢN TRỊ · DỊCH VỤ CỘNG THÊM</span>
        <h1>Yêu cầu tư vấn</h1>
        <p>Yêu cầu gửi từ các trang dịch vụ cộng thêm. Liên hệ khách trong 24 giờ và cập nhật trạng thái sau mỗi lần trao đổi.</p>
      </div>
      <RequestQueue />
    </main>
  );
}

/** The filter lives in the URL (?q=&loai=&trang-thai=&trang=) so a reload or a shared link keeps it. */
function RequestQueue() {
  const router = useRouter();
  const pathname = usePathname();
  const filter = readFilter(new URLSearchParams(useSearchParams().toString()));
  const { state, retry } = useResource(`admin-requests:${writeFilter(filter)}`,
    signal => getAdminServiceRequests(filter, signal));
  const go = (next: AdminRequestFilter) => router.replace(pathname + writeFilter(next), { scroll: false });

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    go(changeFilter(filter, { q: String(new FormData(event.currentTarget).get("q") ?? "") }));
  }

  return (
    <>
      <Filters filter={filter} onSearch={search} onChange={go} onRefresh={retry} />
      {state.status === "loading" && <LoadingState label="Đang tải yêu cầu…" />}
      {state.status === "error" && <ErrorState error={state.error} onRetry={retry} />}
      {state.status === "ready" && state.data.items.length === 0 && (
        hasActiveFilter(filter)
          ? <EmptyState title="Không có yêu cầu phù hợp bộ lọc">
              <button type="button" className="btn btn-outline" onClick={() => go(EMPTY_FILTER)}>Xóa bộ lọc</button>
            </EmptyState>
          : <EmptyState title="Chưa có yêu cầu nào">Yêu cầu khách gửi từ trang dịch vụ cộng thêm sẽ hiện ở đây.</EmptyState>
      )}
      {state.status === "ready" && state.data.items.length > 0 && (
        <>
          <p className="admin-count" aria-live="polite">{state.data.total} yêu cầu</p>
          <RequestTable rows={state.data.items} />
          <Pagination label="Trang yêu cầu" page={Math.min(filter.page, pageCount(state.data.total))}
            pageCount={pageCount(state.data.total)} onChange={page => go({ ...filter, page })} />
        </>
      )}
    </>
  );
}

interface FiltersProps {
  filter: AdminRequestFilter;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (filter: AdminRequestFilter) => void;
  onRefresh: () => void;
}

function Filters({ filter, onSearch, onChange, onRefresh }: FiltersProps) {
  return (
    <div className="sh-toolbar admin-filters">
      <form role="search" aria-label="Tìm yêu cầu" className="admin-search" onSubmit={onSearch}>
        <label className="sh-field">
          Tìm kiếm
          {/* Keyed by the URL value so Back/Forward refreshes the box without syncing state by hand. */}
          <input key={filter.q} name="q" type="search" defaultValue={filter.q} maxLength={MAX_QUERY_LENGTH}
            placeholder="Mã yêu cầu, họ tên, SĐT, email" />
        </label>
        <button type="submit" className="btn btn-primary">Tìm</button>
      </form>
      <label className="sh-field">
        Dịch vụ
        <select value={filter.serviceType}
          onChange={event => onChange(changeFilter(filter, { serviceType: event.target.value as ServiceRequestType | "" }))}>
          <option value="">Tất cả</option>
          {EXTRA_SERVICES.map(service => <option key={service.type} value={service.type}>{service.name}</option>)}
        </select>
      </label>
      <label className="sh-field">
        Trạng thái
        <select value={filter.status}
          onChange={event => onChange(changeFilter(filter, { status: event.target.value as ServiceRequestStatus | "" }))}>
          <option value="">Tất cả</option>
          {SERVICE_REQUEST_STATUSES.map(status => <option key={status} value={status}>{STATUS_META[status].label}</option>)}
        </select>
      </label>
      <button type="button" className="btn btn-outline" onClick={onRefresh}>Làm mới</button>
    </div>
  );
}

export function ServiceTypeLabel({ type }: { type: string }) {
  const service = serviceOfType(type);
  if (!service) return <span>{type}</span>;
  return (
    <span className="admin-service">
      <span className={`svc-tile admin-service-tile svc-tone--${service.tone}`} aria-hidden="true">
        <Icon name={service.icon} size={16} />
      </span>
      {service.name}
    </span>
  );
}

export function RequestStatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

// Header cells and the phone card labels (td[data-label]) share these names.
const REQUEST_COLUMNS = ["Mã", "Dịch vụ", "Họ tên", "SĐT", "Ngày gửi", "Trạng thái", "Phụ trách"] as const;
const [CODE, SERVICE, NAME, PHONE, SENT_AT, STATUS, ASSIGNEE] = REQUEST_COLUMNS;

function RequestTable({ rows }: { rows: ServiceRequestSummary[] }) {
  return (
    <div className="sh-table-wrap">
      <table className="sh-table sh-table--cards">
        <caption className="sr-only">Danh sách yêu cầu tư vấn, mới nhất trước</caption>
        <thead>
          <tr>{REQUEST_COLUMNS.map(column => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td data-label={CODE}>
                <Link href={`/admin/service-requests/${encodeURIComponent(row.id)}`}>{row.code}</Link>
              </td>
              <td data-label={SERVICE}><ServiceTypeLabel type={row.serviceType} /></td>
              <td data-label={NAME}>{row.fullName}{row.email && <small>{row.email}</small>}</td>
              <td data-label={PHONE}><a className="admin-phone" href={`tel:${row.phone}`}>{row.phone}</a></td>
              <td data-label={SENT_AT}>{formatDateTime(row.createdAt)}</td>
              <td data-label={STATUS}><RequestStatusBadge status={row.status} /></td>
              <td data-label={ASSIGNEE}>{row.assignedToName ?? <span className="admin-muted">Chưa có</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
