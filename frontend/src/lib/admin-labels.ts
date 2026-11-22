/** Vietnamese labels of the admin codes (statuses, roles, scopes). Pure, tested in tests/admin.test.cjs. */
import type { BadgeTone } from "@/components/ui/Badge";
import type { DepartureStatus, InclusionType, StaffAssignment, TourStatus } from "@/types/admin";

export const TOUR_STATUS: Record<TourStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Bản nháp", tone: "neutral" },
  published: { label: "Đang bán", tone: "success" },
  paused: { label: "Đã ẩn", tone: "warning" },
  archived: { label: "Lưu trữ", tone: "neutral" },
};

export const DEPARTURE_STATUS: Record<DepartureStatus, { label: string; tone: BadgeTone }> = {
  open: { label: "Mở bán", tone: "success" },
  closed: { label: "Đóng bán", tone: "warning" },
  cancelled: { label: "Đã hủy", tone: "danger" },
};

export const INCLUSION_TYPES: { value: InclusionType; label: string }[] = [
  { value: "hotel", label: "Khách sạn" }, { value: "flight", label: "Vé máy bay" },
  { value: "transport", label: "Xe đưa đón" }, { value: "meal", label: "Bữa ăn" },
  { value: "guide", label: "Hướng dẫn viên" }, { value: "ticket", label: "Vé tham quan" },
  { value: "other", label: "Khác" },
];

/** 0 = Sunday, as in .NET's DayOfWeek and JavaScript's Date#getDay. Listed Monday first, Vietnamese style. */
export const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "T2" }, { value: 2, label: "T3" }, { value: 3, label: "T4" }, { value: 4, label: "T5" },
  { value: 5, label: "T6" }, { value: 6, label: "T7" }, { value: 0, label: "CN" },
];

export const STAFF_ROLES = [
  { value: "STAFF", label: "Nhân viên" },
  { value: "BRANCH_MANAGER", label: "Quản lý chi nhánh" },
  { value: "ADMIN", label: "Quản trị viên" },
] as const;

export const STAFF_SCOPES = [
  { value: "branch", label: "Chi nhánh" },
  { value: "region", label: "Khu vực" },
  { value: "global", label: "Toàn quốc" },
] as const;

export const AUDIT_ENTITIES: { value: string; label: string }[] = [
  { value: "tour", label: "Tour" }, { value: "departure", label: "Lịch khởi hành" },
  { value: "booking", label: "Đơn đặt chỗ" }, { value: "service_request", label: "Yêu cầu dịch vụ" },
  { value: "staff_assignment", label: "Phân quyền" },
];

export function staffRoleLabel(code: string): string {
  return STAFF_ROLES.find(role => role.value === code)?.label ?? code;
}

/** "Chi nhánh TP.HCM", "Khu vực Miền Nam" or "Toàn quốc". */
export function assignmentScopeLabel(assignment: StaffAssignment): string {
  if (assignment.scope === "branch") return assignment.branchName ?? "Chi nhánh";
  if (assignment.scope === "region") return `Khu vực ${assignment.regionName ?? ""}`.trim();
  return "Toàn quốc";
}

export function entityLabel(type: string): string {
  return AUDIT_ENTITIES.find(entity => entity.value === type)?.label ?? type;
}
