/**
 * Back office for consultation requests: status labels, the list filter kept in the URL, and the
 * service-specific details turned into Vietnamese label/value pairs. Pure, so it is unit tested.
 */
import { DETAIL_FIELDS, type DetailField } from "@/lib/service-request-form";
import {
  SERVICE_REQUEST_STATUSES, SERVICE_REQUEST_TYPES, type ServiceRequestStatus, type ServiceRequestType,
} from "@/types/service-request";

export type StatusTone = "warning" | "info" | "neutral";

export const STATUS_META: Record<ServiceRequestStatus, { label: string; tone: StatusTone }> = {
  new: { label: "Mới", tone: "warning" },
  contacted: { label: "Đã liên hệ", tone: "info" },
  closed: { label: "Đã đóng", tone: "neutral" },
};

export function statusMeta(status: string): { label: string; tone: StatusTone } {
  return STATUS_META[status as ServiceRequestStatus] ?? { label: status, tone: "neutral" };
}

export const ADMIN_PAGE_SIZE = 20;
export const MAX_QUERY_LENGTH = 100;

// ---- Filter <-> URL -------------------------------------------------------------------------------

export interface AdminRequestFilter {
  q: string;
  serviceType: ServiceRequestType | "";
  status: ServiceRequestStatus | "";
  page: number;
}

export const EMPTY_FILTER: AdminRequestFilter = { q: "", serviceType: "", status: "", page: 1 };

const isType = (value: string): value is ServiceRequestType =>
  (SERVICE_REQUEST_TYPES as readonly string[]).includes(value);
const isStatus = (value: string): value is ServiceRequestStatus =>
  (SERVICE_REQUEST_STATUSES as readonly string[]).includes(value);

/** Reads the filter from the page URL; unknown or malformed values fall back to "all" / page 1. */
export function readFilter(params: URLSearchParams): AdminRequestFilter {
  const type = params.get("loai") ?? "";
  const status = params.get("trang-thai") ?? "";
  const page = Number(params.get("trang") ?? "1");
  return {
    q: (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    serviceType: isType(type) ? type : "",
    status: isStatus(status) ? status : "",
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** Query string for the page URL ("" when nothing is filtered); defaults are left out so URLs stay short. */
export function writeFilter(filter: AdminRequestFilter): string {
  const params = new URLSearchParams();
  const q = filter.q.trim();
  if (q) params.set("q", q);
  if (filter.serviceType) params.set("loai", filter.serviceType);
  if (filter.status) params.set("trang-thai", filter.status);
  if (filter.page > 1) params.set("trang", String(filter.page));
  const query = params.toString();
  return query ? "?" + query : "";
}

/** Any change other than the page itself starts again from page 1. */
export function changeFilter(filter: AdminRequestFilter, change: Partial<Omit<AdminRequestFilter, "page">>)
  : AdminRequestFilter {
  return { ...filter, ...change, page: 1 };
}

export function hasActiveFilter(filter: AdminRequestFilter): boolean {
  return Boolean(filter.q.trim() || filter.serviceType || filter.status);
}

/** Query string for GET /api/admin/service-requests. */
export function apiQuery(filter: AdminRequestFilter, pageSize = ADMIN_PAGE_SIZE): string {
  const params = new URLSearchParams();
  if (filter.q.trim()) params.set("q", filter.q.trim());
  if (filter.serviceType) params.set("serviceType", filter.serviceType);
  if (filter.status) params.set("status", filter.status);
  params.set("page", String(filter.page));
  params.set("pageSize", String(pageSize));
  return "?" + params.toString();
}

export function pageCount(total: number, pageSize = ADMIN_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// ---- Details -> Vietnamese labels ----------------------------------------------------------------

export interface DetailLine { label: string; value: string }

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatValue(field: DetailField, raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const text = String(raw);
  switch (field.kind) {
    case "select":
      return field.options.find(option => option.value === text)?.label ?? text;
    case "date": {
      const match = ISO_DATE.exec(text);
      return match ? `${match[3]}/${match[2]}/${match[1]}` : text;
    }
    default:
      return text;
  }
}

/**
 * Stored details as label/value lines in form order, using the same labels as the public form.
 * Only the fields defined for the service are shown; anything else in the JSON is ignored.
 */
export function describeDetails(serviceType: string, details: Record<string, unknown>): DetailLine[] {
  if (!isType(serviceType)) return [];
  return DETAIL_FIELDS[serviceType].flatMap(field => {
    const value = formatValue(field, details[field.name]);
    return value === null ? [] : [{ label: field.label, value }];
  });
}
