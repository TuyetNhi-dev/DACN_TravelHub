"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import { revokeStaff, setStaffLocked } from "@/services/admin-system";
import type { StaffMember } from "@/types/admin";

export function useStaffActions(replace: (rows: StaffMember[]) => void) {
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function lockToggle(member: StaffMember) {
    const locked = member.accountStatus !== "disabled";
    const verb = locked ? "Khóa" : "Mở khóa";
    if (!window.confirm(`${verb} tài khoản ${member.fullName}?`)) return;
    await run(member.userId, () => setStaffLocked(member.userId, locked), "Không cập nhật được tài khoản.");
  }

  async function revoke(assignmentId: string) {
    if (!window.confirm("Gỡ phân quyền này khỏi tài khoản?")) return;
    await run(assignmentId, () => revokeStaff(assignmentId), "Không gỡ được phân quyền.");
  }

  async function run(id: string, action: () => Promise<StaffMember[]>, fallback: string) {
    setBusyId(id);
    setError("");
    try {
      replace(await action());
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : fallback);
    } finally {
      setBusyId("");
    }
  }

  return { busyId, error, lockToggle, revoke };
}
