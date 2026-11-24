"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api-client";
import { STAFF_ROLES, STAFF_SCOPES } from "@/lib/admin-labels";
import { assignStaff } from "@/services/admin-system";
import type { AdminLookups, AssignStaffInput, StaffMember } from "@/types/admin";

const EMPTY: AssignStaffInput = { email: "", role: "STAFF", scope: "branch", regionId: null, branchId: null };

export function AssignStaffForm({ lookups, onAssigned }: {
  lookups: AdminLookups; onAssigned: (rows: StaffMember[]) => void;
}) {
  const [form, setForm] = useState<AssignStaffInput>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState("");
  function change<K extends keyof AssignStaffInput>(key: K, value: AssignStaffInput[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setFailure("");
    try {
      onAssigned(await assignStaff({ ...form, email: form.email.trim() }));
      setMessage("Đã cập nhật phân quyền nhân viên.");
      setForm(EMPTY);
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : "Không thể cập nhật phân quyền.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="adm-panel adm-staff-form" onSubmit={submit}>
    <div><h2>Thêm hoặc cập nhật vai trò</h2>
      <p className="adm-note">Nhập email của tài khoản đã đăng ký.</p></div>
    <label className="sh-field">Email tài khoản<input type="email" required maxLength={254} value={form.email}
      onChange={event => change("email", event.target.value)} /></label>
    <AssignmentFields form={form} lookups={lookups} onChange={change}
      onRoleChange={role => setForm(current => ({ ...current, role,
        ...(role === "ADMIN" ? { scope: "global", regionId: null, branchId: null } : {}) }))}
      onScopeChange={scope => setForm(current => ({ ...current, scope, regionId: null, branchId: null }))} />
    <div className="adm-actions"><button className="btn btn-primary" type="submit" disabled={busy}>
      {busy ? "Đang lưu…" : "Lưu phân quyền"}
    </button></div>
    <AssignmentFeedback message={message} failure={failure} />
  </form>;
}

function AssignmentFeedback({ message, failure }: { message: string; failure: string }) {
  return <>
    {message && <p className="sh-success" role="status">{message}</p>}
    {failure && <p className="sh-error" role="alert">{failure}</p>}
  </>;
}

function AssignmentFields({ form, lookups, onChange, onRoleChange, onScopeChange }: {
  form: AssignStaffInput; lookups: AdminLookups;
  onChange: <K extends keyof AssignStaffInput>(key: K, value: AssignStaffInput[K]) => void;
  onRoleChange: (role: string) => void; onScopeChange: (scope: string) => void;
}) {
  const branches = lookups.branches.filter(branch => branch.canManage);
  return <>
    <label className="sh-field">Vai trò<select value={form.role}
      onChange={event => onRoleChange(event.target.value)}>
      {STAFF_ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
    </select></label>
    <label className="sh-field">Phạm vi<select value={form.scope} disabled={form.role === "ADMIN"}
      onChange={event => onScopeChange(event.target.value)}>
      {STAFF_SCOPES.map(scope => <option key={scope.value} value={scope.value}>{scope.label}</option>)}
    </select></label>
    {form.scope === "region" && <label className="sh-field">Khu vực<select required value={form.regionId ?? ""}
      onChange={event => onChange("regionId", event.target.value || null)}>
      <option value="">Chọn khu vực</option>{lookups.regions.map(region =>
        <option key={region.id} value={region.id}>{region.name}</option>)}
    </select></label>}
    {form.scope === "branch" && <label className="sh-field">Chi nhánh<select required value={form.branchId ?? ""}
      onChange={event => onChange("branchId", event.target.value || null)}>
      <option value="">Chọn chi nhánh</option>{branches.map(branch =>
        <option key={branch.id} value={branch.id}>{branch.name}</option>)}
    </select></label>}
  </>;
}
