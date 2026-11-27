import { apiGet, apiPost } from "@/lib/api-client";
import { listEnvelope, pagedListEnvelope } from "@/lib/decode";
import { decodeAuditLog, decodeStaffMember } from "@/lib/admin-decode";
import { decodeAuditActor } from "@/lib/admin-ops-decode";
import { query } from "@/services/admin-catalog";
import type { AssignStaffInput, AuditLog, Paged, StaffMember } from "@/types/admin";
import type { AuditActor } from "@/types/admin-ops";

const R = "quản trị";

export interface AuditFilter {
  entityType: string;
  action: string;
  actorId: string;
  from: string;
  to: string;
  page: number;
}

export async function getAuditActors(scope: string, signal?: AbortSignal): Promise<AuditActor[]> {
  return listEnvelope(await apiGet(`/api/admin/audit-logs/actors${query({ scope })}`, signal), decodeAuditActor, R);
}

export async function getAuditLogs(filter: AuditFilter, scope: string, signal?: AbortSignal)
  : Promise<Paged<AuditLog>> {
  return pagedListEnvelope(await apiGet(`/api/admin/audit-logs${query({ scope, ...filter })}`, signal),
    decodeAuditLog, R);
}

export async function getStaff(signal?: AbortSignal): Promise<StaffMember[]> {
  return listEnvelope(await apiGet("/api/admin/staff", signal), decodeStaffMember, R);
}

export async function assignStaff(input: AssignStaffInput): Promise<StaffMember[]> {
  return listEnvelope(await apiPost("/api/admin/staff/assignments", input), decodeStaffMember, R);
}

/** Locks (or unlocks) the sign-in of a staff account; its sessions end on their next request. */
export async function setStaffLocked(userId: string, locked: boolean): Promise<StaffMember[]> {
  const action = locked ? "lock" : "unlock";
  const value = await apiPost(`/api/admin/staff/users/${encodeURIComponent(userId)}/${action}`);
  return listEnvelope(value, decodeStaffMember, R);
}

export async function revokeStaff(assignmentId: string): Promise<StaffMember[]> {
  const value = await apiPost(`/api/admin/staff/assignments/${encodeURIComponent(assignmentId)}/deactivate`);
  return listEnvelope(value, decodeStaffMember, R);
}
