"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { useNewRequestCount } from "@/hooks/useNewRequestCount";
import { useResource } from "@/hooks/useResource";
import { formatDateTime } from "@/lib/format";
import { describeDetails } from "@/lib/service-request-admin";
import { getAdminServiceRequest } from "@/services/admin-service-requests";
import type { ServiceRequestDetail } from "@/types/service-request";
import { RequestFollowUp } from "./ServiceRequestFollowUp";
import { RequestStatusBadge, ServiceTypeLabel } from "./ServiceRequestsAdminPage";

const LIST_HREF = "/admin/service-requests";

export function ServiceRequestAdminPage({ requestId }: { requestId: string }) {
  return (
    <main id="main-content" className="sh-page adm-page">
      <div className="sh-page-head">
        <Breadcrumb items={[{ label: "Yêu cầu tư vấn", href: LIST_HREF }, { label: "Chi tiết yêu cầu" }]} />
        <h1>Xử lý yêu cầu tư vấn</h1>
      </div>
      <RequestDetail requestId={requestId} />
    </main>
  );
}

function RequestDetail({ requestId }: { requestId: string }) {
  const { state, retry, replace } = useResource(`admin-request:${requestId}`,
    signal => getAdminServiceRequest(requestId, signal));
  const { refresh: refreshNewCount } = useNewRequestCount();
  const onChanged = (next: ServiceRequestDetail) => {
    const before = state.status === "ready" ? state.data.summary.status : null;
    replace(next);
    // Only a status change can move a request in or out of "new"; notes and assignment cannot.
    if (next.summary.status !== before) refreshNewCount();
  };
  return (
    <>
      {state.status === "loading" && <LoadingState label="Đang tải yêu cầu…" />}
      {state.status === "error" && (
        <ErrorState error={state.error} onRetry={retry} backHref={LIST_HREF} backLabel="Danh sách yêu cầu" />
      )}
      {state.status === "ready" && (
        <div className="admin-request">
          <RequestInfo detail={state.data} />
          <RequestFollowUp detail={state.data} onChanged={onChanged} />
        </div>
      )}
    </>
  );
}

function RequestInfo({ detail }: { detail: ServiceRequestDetail }) {
  const { summary } = detail;
  const lines = describeDetails(summary.serviceType, detail.details);
  return (
    <div className="admin-request-main">
      <section className="admin-card" aria-labelledby="request-head">
        <div className="admin-request-head">
          <div>
            <h2 id="request-head">{summary.code}</h2>
            <ServiceTypeLabel type={summary.serviceType} />
          </div>
          <RequestStatusBadge status={summary.status} />
        </div>
        <dl className="admin-dl">
          <dt>Họ tên</dt><dd>{summary.fullName}</dd>
          <dt>Số điện thoại</dt>
          <dd><a href={`tel:${summary.phone}`} aria-label={`Gọi ${summary.phone}`}>{summary.phone}</a></dd>
          <dt>Email</dt>
          <dd>{summary.email ? <a href={`mailto:${summary.email}`}>{summary.email}</a> : <span className="admin-muted">Không có</span>}</dd>
          <dt>Ngày gửi</dt><dd>{formatDateTime(summary.createdAt)}</dd>
          <dt>Đồng ý liên hệ</dt><dd>{formatDateTime(detail.consentAt)}</dd>
        </dl>
      </section>

      <section className="admin-card" aria-labelledby="request-details">
        <h2 id="request-details">Chi tiết yêu cầu</h2>
        {lines.length > 0 ? (
          <dl className="admin-dl">
            {lines.map(line => <div key={line.label} className="admin-dl-row"><dt>{line.label}</dt><dd>{line.value}</dd></div>)}
          </dl>
        ) : <p className="admin-muted">Không có thông tin chi tiết.</p>}
        <h3>Ghi chú của khách</h3>
        {detail.customerNote ? <p className="admin-quote">{detail.customerNote}</p> : <p className="admin-muted">Không có.</p>}
      </section>
    </div>
  );
}
