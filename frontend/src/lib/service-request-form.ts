/**
 * Consultation form ("Gửi yêu cầu tư vấn"): field definitions, client-side validation and the request payload.
 * Rules, field keys and messages mirror ServiceRequestValidator on the server, so a server field error
 * ("details.visitDate") lands under the same input. Pure: no React, no fetch.
 */
import type { ServiceRequestType } from "@/types/service-request";

export type FormValues = Record<string, string>;
export type FormErrors = Record<string, string>;

export interface Option { value: string; label: string }

interface FieldBase {
  /** Key inside `details`; the form input name and error key is `details.<name>`. */
  name: string;
  label: string;
  required: boolean;
  hint?: string;
  placeholder?: string;
}

export type DetailField =
  | (FieldBase & { kind: "text"; message: string })
  | (FieldBase & { kind: "number"; min: number; max: number })
  | (FieldBase & { kind: "select"; options: readonly Option[]; message: string })
  /** `after`: must be on or after another date field, at most `maxDays` later (return / end dates). */
  | (FieldBase & { kind: "date"; after?: { field: string; maxDays: number; message: string } });

// Limits shared with ServiceRequestLimits on the server.
export const LIMITS = {
  minName: 2, maxName: 120, maxEmail: 254, maxNote: 1000, minPlace: 2, maxPlace: 160,
  maxTravelers: 50, minGroup: 10, maxGroup: 2000,
  maxCarDays: 60, maxGroupDays: 30, maxDaysAhead: 730,
} as const;

export const PRIVACY_HINT = "Không nhập số hộ chiếu/CCCD.";
export const PHONE_MESSAGE = "Số điện thoại cần 9–15 chữ số, có thể bắt đầu bằng +.";
export const DATE_MESSAGE = "Ngày phải từ hôm nay trở đi và trong vòng 2 năm.";
export const RATE_LIMIT_MESSAGE = "Bạn gửi quá nhiều yêu cầu, thử lại sau ít phút.";

export const VEHICLE_OPTIONS: readonly Option[] = [
  { value: "4", label: "Xe 4 chỗ" }, { value: "7", label: "Xe 7 chỗ" }, { value: "16", label: "Xe 16 chỗ" },
  { value: "29", label: "Xe 29 chỗ" }, { value: "45", label: "Xe 45 chỗ" },
];
export const AIRPORT_OPTIONS: readonly Option[] = [
  { value: "none", label: "Không cần" }, { value: "pickup", label: "Đón sân bay" },
  { value: "dropoff", label: "Tiễn sân bay" }, { value: "both", label: "Cả đón và tiễn" },
];
export const VISA_OPTIONS: readonly Option[] = [
  { value: "tourist", label: "Du lịch" }, { value: "business", label: "Công tác" },
  { value: "family", label: "Thăm thân" },
];
export const BUDGET_OPTIONS: readonly Option[] = [
  { value: "under_3m", label: "Dưới 3 triệu/người" }, { value: "3m_5m", label: "3–5 triệu/người" },
  { value: "5m_10m", label: "5–10 triệu/người" }, { value: "over_10m", label: "Trên 10 triệu/người" },
];
export const PROGRAM_OPTIONS: readonly Option[] = [
  { value: "team_building", label: "Team building" }, { value: "conference", label: "Hội nghị, hội thảo" },
  { value: "incentive", label: "Du lịch khen thưởng" }, { value: "custom", label: "Thiết kế tour riêng" },
];

const place = (name: string, label: string, message: string, placeholder?: string): DetailField =>
  ({ kind: "text", name, label, message, placeholder, required: true });
const count = (name: string, label: string, min: number, max: number, required = true): DetailField =>
  ({ kind: "number", name, label, min, max, required });
const date = (name: string, label: string): DetailField => ({ kind: "date", name, label, required: true });

export const DETAIL_FIELDS: Record<ServiceRequestType, readonly DetailField[]> = {
  attraction_tickets: [
    place("destination", "Điểm đến / khu vui chơi", "Vui lòng nhập điểm đến hoặc khu vui chơi.",
      "VD: khu vui chơi ở Đà Nẵng, show diễn ở Hội An"),
    date("visitDate", "Ngày dự kiến"),
    count("adults", "Số người lớn", 1, LIMITS.maxTravelers),
    count("children", "Số trẻ em", 0, LIMITS.maxTravelers, false),
  ],
  car_rental: [
    { kind: "select", name: "vehicleSeats", label: "Loại xe", options: VEHICLE_OPTIONS, required: true,
      message: "Vui lòng chọn loại xe 4, 7, 16, 29 hoặc 45 chỗ.", hint: "Số chỗ đã gồm tài xế." },
    count("passengers", "Số khách", 1, LIMITS.maxTravelers),
    date("departDate", "Ngày đi"),
    { kind: "date", name: "returnDate", label: "Ngày về", required: true,
      after: { field: "departDate", maxDays: LIMITS.maxCarDays,
        message: `Ngày về phải từ ngày đi trở đi, tối đa ${LIMITS.maxCarDays} ngày.` } },
    place("pickupPlace", "Điểm đón", "Vui lòng nhập điểm đón.", "VD: Sân bay Tân Sơn Nhất"),
    place("dropoffPlace", "Điểm đến", "Vui lòng nhập điểm đến.", "VD: Vũng Tàu"),
    { kind: "select", name: "airportTransfer", label: "Đón/tiễn sân bay", options: AIRPORT_OPTIONS,
      required: false, message: "Lựa chọn đón/tiễn sân bay không hợp lệ." },
  ],
  visa: [
    place("country", "Quốc gia", "Vui lòng nhập quốc gia xin visa.", "VD: Nhật Bản"),
    { kind: "select", name: "visaType", label: "Loại visa", options: VISA_OPTIONS, required: true,
      message: "Vui lòng chọn loại visa." },
    date("travelDate", "Ngày dự kiến đi"),
    count("applicants", "Số người", 1, LIMITS.maxTravelers),
  ],
  group_tour: [
    place("companyName", "Tên công ty / tổ chức", "Vui lòng nhập tên công ty hoặc tổ chức."),
    count("groupSize", "Số người", LIMITS.minGroup, LIMITS.maxGroup),
    date("startDate", "Từ ngày"),
    { kind: "date", name: "endDate", label: "Đến ngày", required: true,
      after: { field: "startDate", maxDays: LIMITS.maxGroupDays,
        message: `Ngày kết thúc phải từ ngày bắt đầu trở đi, tối đa ${LIMITS.maxGroupDays} ngày.` } },
    { kind: "select", name: "budget", label: "Ngân sách dự kiến", options: BUDGET_OPTIONS, required: true,
      message: "Vui lòng chọn ngân sách dự kiến." },
    { kind: "select", name: "programType", label: "Loại chương trình", options: PROGRAM_OPTIONS, required: true,
      message: "Vui lòng chọn loại chương trình." },
  ],
};

export const detailKey = (name: string) => `details.${name}`;

/** Initial values: everything empty except sensible defaults the server would also assume. */
export function initialValues(type: ServiceRequestType): FormValues {
  const values: FormValues = { fullName: "", phone: "", email: "", note: "", website: "" };
  for (const field of DETAIL_FIELDS[type]) values[detailKey(field.name)] = "";
  if (type === "car_rental") values[detailKey("airportTransfer")] = "none";
  if (type === "attraction_tickets") values[detailKey("children")] = "0";
  return values;
}

// ---- Validation -----------------------------------------------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
const PHONE = /^\+?[0-9]{9,15}$/;
const EMAIL = /^[^\s@]+@[^\s@]+$/;

/** Phone as the server stores it: spaces, dots, dashes and brackets removed. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s.\-()]/g, "");
}

function dayNumber(iso: string): number | null {
  if (!ISO_DATE.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  return check.getUTCDate() === day && check.getUTCMonth() === month - 1 ? ms / DAY_MS : null;
}

function wholeNumber(raw: string): number | null {
  return /^-?\d+$/.test(raw.trim()) ? Number(raw.trim()) : null;
}

/** Upper bound of a number field; a car carries at most its seats minus the driver. */
function maxOf(field: Extract<DetailField, { kind: "number" }>, type: ServiceRequestType, values: FormValues): number {
  if (type !== "car_rental" || field.name !== "passengers") return field.max;
  const seats = wholeNumber(values[detailKey("vehicleSeats")] ?? "");
  return seats !== null && VEHICLE_OPTIONS.some(o => Number(o.value) === seats) ? seats - 1 : field.max;
}

function fieldError(field: DetailField, type: ServiceRequestType, values: FormValues, today: string): string | null {
  const raw = (values[detailKey(field.name)] ?? "").trim();
  if (!raw && !field.required) return null;
  switch (field.kind) {
    case "text":
      return raw.length >= LIMITS.minPlace && raw.length <= LIMITS.maxPlace ? null : field.message;
    case "select":
      return field.options.some(option => option.value === raw) ? null : field.message;
    case "number":
      return numberError(field, raw, maxOf(field, type, values));
    case "date":
      return dateError(field, raw, values, today);
  }
}

function numberError(field: Extract<DetailField, { kind: "number" }>, raw: string, max: number): string | null {
  const value = wholeNumber(raw);
  return value !== null && value >= field.min && value <= max ? null : `${field.label} từ ${field.min} đến ${max}.`;
}

function dateError(field: Extract<DetailField, { kind: "date" }>, raw: string, values: FormValues,
  today: string): string | null {
  const day = dayNumber(raw);
  if (field.after) {
    const start = dayNumber((values[detailKey(field.after.field)] ?? "").trim());
    if (day === null) return field.after.message;
    return start === null || (day >= start && day <= start + field.after.maxDays) ? null : field.after.message;
  }
  const now = dayNumber(today);
  return day !== null && now !== null && day >= now && day <= now + LIMITS.maxDaysAhead ? null : DATE_MESSAGE;
}

function contactErrors(values: FormValues, consent: boolean): FormErrors {
  const errors: FormErrors = {};
  const name = values.fullName.trim();
  if (name.length < LIMITS.minName || name.length > LIMITS.maxName)
    errors.fullName = `Họ tên cần từ ${LIMITS.minName} đến ${LIMITS.maxName} ký tự.`;
  if (!PHONE.test(normalizePhone(values.phone))) errors.phone = PHONE_MESSAGE;
  const email = values.email.trim();
  if (email && (email.length > LIMITS.maxEmail || !EMAIL.test(email))) errors.email = "Email không hợp lệ.";
  if (values.note.trim().length > LIMITS.maxNote) errors.note = `Ghi chú tối đa ${LIMITS.maxNote} ký tự.`;
  if (!consent) errors.consent = "Vui lòng đồng ý để nhân viên SàiHành liên hệ tư vấn.";
  return errors;
}

/** Every problem at once, keyed like the server ("fullName", "details.visitDate"). `today` is "yyyy-mm-dd" (VN). */
export function validateForm(type: ServiceRequestType, values: FormValues, consent: boolean,
  today: string): FormErrors {
  const errors = contactErrors(values, consent);
  for (const field of DETAIL_FIELDS[type]) {
    const message = fieldError(field, type, values, today);
    if (message) errors[detailKey(field.name)] = message;
  }
  return errors;
}

// ---- Payload --------------------------------------------------------------------------------------

export interface ServiceRequestPayload {
  serviceType: ServiceRequestType;
  fullName: string;
  phone: string;
  email: string | null;
  note: string | null;
  consent: boolean;
  /** Honeypot, sent as typed so the server can drop bot submissions. */
  website: string;
  details: Record<string, string | number>;
}

/** Body for POST /api/service-requests: only this service's details, numbers as numbers, blanks omitted. */
export function buildPayload(type: ServiceRequestType, values: FormValues, consent: boolean): ServiceRequestPayload {
  const details: Record<string, string | number> = {};
  for (const field of DETAIL_FIELDS[type]) {
    const raw = (values[detailKey(field.name)] ?? "").trim();
    if (!raw) continue;
    const numeric = field.kind === "number" || (field.kind === "select" && field.name === "vehicleSeats");
    details[field.name] = numeric ? Number(raw) : raw;
  }
  return {
    serviceType: type,
    fullName: values.fullName.trim(),
    phone: normalizePhone(values.phone),
    email: values.email.trim() || null,
    note: values.note.trim() || null,
    consent,
    website: values.website ?? "",
    details,
  };
}

/** Message for a failed submit: a dedicated one for the per-IP rate limit (HTTP 429). */
export function submitErrorMessage(error: { status?: number; message: string }): string {
  return error.status === 429 ? RATE_LIMIT_MESSAGE : error.message;
}
