"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { STATUS_META } from "@/lib/service-request-admin";
import {
  addServiceRequestNote, assignServiceRequest, updateServiceRequestStatus,
} from "@/services/admin-service-requests";
import { SERVICE_REQUEST_STATUSES, type ServiceRequestDetail, type ServiceRequestStatus } from "@/types/service-request";

const MAX_NOTE = 2000;

interface FollowUpProps {
  detail: ServiceRequestDetail;
  onChanged: (detail: ServiceRequestDetail) => void;
}

/** One action at a time: every call returns the updated request, which replaces the page data. */
function useAction(onChanged: (detail: ServiceRequestDetail) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(action: () => Promise<ServiceRequestDetail>): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      onChanged(await action());
      return true;
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Thao tác không thành công. Vui lòng thử lại.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

/** Status, assignee and internal notes of a request. */
export function RequestFollowUp({ detail, onChanged }: FollowUpProps) {
  const action = useAction(onChanged);
  return (
    <aside className="admin-request-side" aria-label="Xử lý yêu cầu">
      {action.error && <p className="sh-error" role="alert">{action.error}</p>}
      <StatusCard key={detail.summary.status} detail={detail} busy={action.busy} run={action.run} />
      <AssigneeCard detail={detail} busy={action.busy} run={action.run} />
      <NotesCard detail={detail} busy={action.busy} run={action.run} />
    </aside>
  );
}

interface CardProps {
  detail: ServiceRequestDetail;
  busy: boolean;
  run: (action: () => Promise<ServiceRequestDetail>) => Promise<boolean>;
}

function StatusCard({ detail, busy, run }: CardProps) {
  const { id, status } = detail.summary;
  // The parent keys this card by the saved status, so the select resets after an update.
  const [choice, setChoice] = useState(status as ServiceRequestStatus);
  return (
    <section className="admin-card" aria-labelledby="status-title">
      <h2 id="status-title">Trạng thái</h2>
      <div className="admin-inline">
        <label className="sh-field">
          <span className="sr-only">Trạng thái mới</span>
          <select value={choice} onChange={event => setChoice(event.target.value as ServiceRequestStatus)}>
            {SERVICE_REQUEST_STATUSES.map(value => <option key={value} value={value}>{STATUS_META[value].label}</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-primary" disabled={busy || choice === status}
          onClick={() => void run(() => updateServiceRequestStatus(id, choice))}>Cập nhật</button>
      </div>
    </section>
  );
}

function AssigneeCard({ detail, busy, run }: CardProps) {
  const { session } = useAuth();
  const { id, assignedUserId, assignedToName } = detail.summary;
  const mine = assignedUserId !== null && assignedUserId === session?.user.id;
  return (
    <section className="admin-card" aria-labelledby="assignee-title">
      <h2 id="assignee-title">Người phụ trách</h2>
      <p>{assignedToName ? (mine ? `${assignedToName} (bạn)` : assignedToName) : <span className="admin-muted">Chưa có ai nhận</span>}</p>
      <div className="admin-inline">
        {!mine && (
          <button type="button" className="btn btn-primary" disabled={busy}
            onClick={() => void run(() => assignServiceRequest(id, true))}>Nhận xử lý</button>
        )}
        {assignedUserId && (
          <button type="button" className="btn btn-outline" disabled={busy}
            onClick={() => void run(() => assignServiceRequest(id, false))}>Bỏ nhận</button>
        )}
      </div>
    </section>
  );
}

function NotesCard({ detail, busy, run }: CardProps) {
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const trimmed = note.trim();
  const invalid = trimmed.length === 0 || trimmed.length > MAX_NOTE;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (invalid) return;
    if (await run(() => addServiceRequestNote(detail.summary.id, trimmed))) {
      setNote("");
      setTouched(false);
    }
  }

  return (
    <section className="admin-card" aria-labelledby="notes-title">
      <h2 id="notes-title">Ghi chú nội bộ</h2>
      {detail.notes.length > 0 ? (
        <ol className="admin-notes">
          {detail.notes.map(item => (
            <li key={item.id}>
              <div className="admin-note-meta"><b>{item.authorName}</b><time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time></div>
              <p>{item.note}</p>
            </li>
          ))}
        </ol>
      ) : <p className="admin-muted">Chưa có ghi chú.</p>}
      <form className="admin-note-form" onSubmit={event => void submit(event)} noValidate>
        <label className="sh-field">
          Thêm ghi chú
          <textarea value={note} rows={3} maxLength={MAX_NOTE} onChange={event => setNote(event.target.value)}
            aria-invalid={touched && invalid} aria-describedby="note-help" />
        </label>
        <small id="note-help" className={touched && invalid ? "admin-error-text" : "admin-muted"}>
          {touched && invalid ? `Ghi chú cần từ 1 đến ${MAX_NOTE} ký tự.` : "Ghi chú chỉ thêm mới, không sửa hay xóa được."}
        </small>
        <button type="submit" className="btn btn-outline" disabled={busy}>Thêm ghi chú</button>
      </form>
    </section>
  );
}
