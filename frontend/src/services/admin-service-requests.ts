import { apiGet, apiPost } from "@/lib/api-client";
import {
  invalid, isRecord, itemEnvelope, list, num, optStr, pagedListEnvelope, str, type Row,
} from "@/lib/decode";
import { apiQuery, type AdminRequestFilter } from "@/lib/service-request-admin";
import type {
  ServiceRequestDetail, ServiceRequestNote, ServiceRequestStatus, ServiceRequestSummary,
} from "@/types/service-request";

const RESOURCE = "yêu cầu tư vấn";
const BASE = "/api/admin/service-requests";

const path = (id: string, action = "") => `${BASE}/${encodeURIComponent(id)}${action}`;

export function decodeSummary(row: Row): ServiceRequestSummary {
  return {
    id: str(row, "id", RESOURCE),
    code: str(row, "code", RESOURCE),
    serviceType: str(row, "serviceType", RESOURCE),
    fullName: str(row, "fullName", RESOURCE),
    phone: str(row, "phone", RESOURCE),
    email: optStr(row, "email", RESOURCE),
    status: str(row, "status", RESOURCE),
    assignedUserId: optStr(row, "assignedUserId", RESOURCE),
    assignedToName: optStr(row, "assignedToName", RESOURCE),
    createdAt: str(row, "createdAt", RESOURCE),
    updatedAt: str(row, "updatedAt", RESOURCE),
  };
}

function decodeNote(row: Row): ServiceRequestNote {
  return {
    id: str(row, "id", RESOURCE),
    authorName: str(row, "authorName", RESOURCE),
    note: str(row, "note", RESOURCE),
    createdAt: str(row, "createdAt", RESOURCE),
  };
}

export function decodeDetail(row: Row): ServiceRequestDetail {
  if (!isRecord(row.summary) || !isRecord(row.details)) return invalid(RESOURCE);
  return {
    summary: decodeSummary(row.summary),
    customerNote: optStr(row, "customerNote", RESOURCE),
    details: row.details,
    consentAt: str(row, "consentAt", RESOURCE),
    notes: list(row.notes, decodeNote, RESOURCE),
  };
}

export async function getAdminServiceRequests(filter: AdminRequestFilter, signal?: AbortSignal)
  : Promise<{ items: ServiceRequestSummary[]; total: number }> {
  return pagedListEnvelope(await apiGet(BASE + apiQuery(filter), signal), decodeSummary, RESOURCE);
}

export async function getAdminServiceRequest(id: string, signal?: AbortSignal): Promise<ServiceRequestDetail> {
  return itemEnvelope(await apiGet(path(id), signal), decodeDetail, RESOURCE);
}

/** Requests still waiting for a first contact (badge next to the admin link). */
export async function getNewServiceRequestCount(signal?: AbortSignal): Promise<number> {
  return itemEnvelope(await apiGet(`${BASE}/new-count`, signal), row => num(row, "count", RESOURCE), RESOURCE);
}

export async function updateServiceRequestStatus(id: string, status: ServiceRequestStatus)
  : Promise<ServiceRequestDetail> {
  return itemEnvelope(await apiPost(path(id, "/status"), { status }), decodeDetail, RESOURCE);
}

export async function addServiceRequestNote(id: string, note: string): Promise<ServiceRequestDetail> {
  return itemEnvelope(await apiPost(path(id, "/notes"), { note }), decodeDetail, RESOURCE);
}

export async function assignServiceRequest(id: string, toMe: boolean): Promise<ServiceRequestDetail> {
  return itemEnvelope(await apiPost(path(id, toMe ? "/assign-to-me" : "/unassign")), decodeDetail, RESOURCE);
}
