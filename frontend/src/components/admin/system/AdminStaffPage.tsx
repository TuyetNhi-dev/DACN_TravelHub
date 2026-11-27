"use client";

import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/StateMessage";
import { ApiError } from "@/lib/api-client";
import { useAdmin } from "@/components/admin/shell/AdminProvider";
import { useResource, type Resource } from "@/hooks/useResource";
import { assignmentScopeLabel, staffRoleLabel } from "@/lib/admin-labels";
import { getStaff } from "@/services/admin-system";
import { getAdminLookups } from "@/services/admin-catalog";
import type { StaffMember } from "@/types/admin";
import { AssignStaffForm } from "./AssignStaffForm";
import { useStaffActions } from "./useStaffActions";

const FORBIDDEN = 403;

export function AdminStaffPage() {
  const { context } = useAdmin();
  const allowed = context.capabilities.manageStaff;
  const staff = useResource(allowed ? "admin:staff" : null, getStaff);
  const lookups = useResource(allowed ? "admin:staff-lookups" : null, getAdminLookups);
  const actions = useStaffActions(staff.replace);

  if (!allowed) return <ErrorState error={new ApiError("Bạn không có quyền quản lý nhân viên.", FORBIDDEN)} />;
  return <main id="main-content" className="sh-page adm-page">
    <PageHeading />
    <StaffContent lookups={lookups.state} staff={staff.state} error={actions.error} busyId={actions.busyId}
      retryStaff={staff.retry} retryLookups={lookups.retry} onAssigned={staff.replace}
      onToggle={actions.lockToggle} onRevoke={actions.revoke} />
  </main>;
}

function StaffContent({ lookups, staff, error, busyId, retryStaff, retryLookups, onAssigned, onToggle, onRevoke }: {
  lookups: Resource<Awaited<ReturnType<typeof getAdminLookups>>>; staff: Resource<StaffMember[]>; error: string;
  busyId: string; retryStaff: () => void; retryLookups: () => void;
  onAssigned: (rows: StaffMember[]) => void; onToggle: (member: StaffMember) => Promise<void>;
  onRevoke: (assignmentId: string) => Promise<void>;
}) {
  return <>
    {lookups.status === "loading" && <LoadingState label="Đang tải danh sách chi nhánh…" />}
    {lookups.status === "error" && <ErrorState error={lookups.error} onRetry={retryLookups} />}
    {lookups.status === "ready" && <AssignStaffForm lookups={lookups.data} onAssigned={onAssigned} />}
    {error && <p className="sh-error" role="alert">{error}</p>}
    {staff.status === "loading" && <LoadingState label="Đang tải nhân viên…" />}
    {staff.status === "error" && <ErrorState error={staff.error} onRetry={retryStaff} />}
    {staff.status === "ready" && staff.data.length === 0 &&
      <EmptyState title="Chưa có nhân viên được phân quyền." />}
    {staff.status === "ready" && staff.data.length > 0 && <StaffTable rows={staff.data}
      busyId={busyId} onToggle={member => void onToggle(member)} onRevoke={id => void onRevoke(id)} />}
  </>;
}

function PageHeading() {
  return <div className="sh-page-head adm-page-head"><div><span className="kicker">QUẢN TRỊ · HỆ THỐNG</span>
    <h1>Nhân viên &amp; phân quyền</h1>
    <p>Gán vai trò theo chi nhánh hoặc khu vực; khóa tài khoản khi cần thiết.</p></div></div>;
}

function StaffTable({ rows, busyId, onToggle, onRevoke }: {
  rows: StaffMember[]; busyId: string; onToggle: (member: StaffMember) => void; onRevoke: (id: string) => void;
}) {
  return <section className="adm-panel adm-staff-panel"><h2>Nhân viên trong hệ thống</h2>
    <div className="sh-table-wrap"><table className="sh-table sh-table--cards">
      <caption className="sr-only">Nhân viên và phạm vi phân quyền</caption>
    <thead><tr><th>Nhân viên</th><th>Vai trò &amp; phạm vi</th>
      <th>Tài khoản</th><th>Thao tác</th></tr></thead>
      <tbody>{rows.map(member => <tr key={member.userId}>
        <td data-label="Nhân viên">{member.fullName}<small>{member.email}</small></td>
        <td data-label="Vai trò & phạm vi">{member.assignments.length ? <ul className="adm-assignment-list">
          {member.assignments.map(assignment => <li key={assignment.id}>
            <span>{staffRoleLabel(assignment.role)} · {assignmentScopeLabel(assignment)}</span>
            <button type="button" disabled={busyId === assignment.id} onClick={() => onRevoke(assignment.id)}>
              Gỡ quyền
            </button>
          </li>)}
        </ul> : "Chưa được gán vai trò"}</td>
        <td data-label="Tài khoản">
          <AccountStatus status={member.accountStatus} />
        </td>
        <td data-label="Thao tác">
          <button className="btn btn-outline" type="button" disabled={busyId === member.userId}
            onClick={() => onToggle(member)}>
            {member.accountStatus === "disabled" ? "Mở khóa" : "Khóa tài khoản"}
          </button>
        </td>
      </tr>)}</tbody>
    </table></div>
  </section>;
}

function AccountStatus({ status }: { status: StaffMember["accountStatus"] }) {
  const label = status === "active" ? "Đang hoạt động" : status === "disabled" ? "Đã khóa" : "Chờ kích hoạt";
  return <Badge tone={status === "active" ? "success" : "warning"}>{label}</Badge>;
}
