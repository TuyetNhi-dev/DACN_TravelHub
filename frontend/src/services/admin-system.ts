import { apiGet, apiPost } from "@/lib/api-client";
import { listEnvelope, pagedListEnvelope } from "@/lib/decode";
import { decodeAuditLog, decodeStaffMember } from "@/lib/admin-decode";
import { query } from "@/services/admin-catalog";
import type { AssignStaffInput, AuditLog, Paged, StaffMember } from "@/types/admin";

const R = "quản trị";

export interface AuditFilter {
  entityType: string;
  from: string;
  to: string;
  page: number;
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

export async function revokeStaff(assignmentId: string): Promise<StaffMember[]> {
  const value = await apiPost(`/api/admin/staff/assignments/${encodeURIComponent(assignmentId)}/deactivate`);
  return listEnvelope(value, decodeStaffMember, R);
}
