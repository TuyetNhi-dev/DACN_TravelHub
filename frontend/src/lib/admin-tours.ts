/** Pure rules of the admin tour screens. The server re-checks every one of them. */
import type { BranchLookup, TourStatus } from "@/types/admin";

/** Mirrors AdminTourService.DefaultPageSize. */
export const TOUR_PAGE_SIZE = 20;

export const tourEditHref = (id: string) => "/admin/tours/" + encodeURIComponent(id);
export const TOUR_LIST_HREF = "/admin/tours";
export const TOUR_NEW_HREF = "/admin/tours/new";

export const pageCountOf = (total: number) => Math.max(1, Math.ceil(total / TOUR_PAGE_SIZE));

/** Same keys as AdminTourSort on the server; it refuses anything else. */
export const TOUR_SORTS = [
  { value: "newest", label: "Mới tạo trước" },
  { value: "code", label: "Mã tour A–Z" },
  { value: "title", label: "Tên tour A–Z" },
  { value: "price", label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
  { value: "departures", label: "Nhiều lịch sắp tới" },
] as const;

/** Filters of /admin/tours as they appear in the URL (empty string = no filter). */
export const TOUR_FILTER_DEFAULTS = {
  query: "", status: "", regionId: "", branchId: "", categoryId: "", sort: "newest", page: 1,
};

export interface StatusAction {
  status: TourStatus;
  label: string;
  done: string;
}

/** AdminTourStatus.Settable on the server; "archived" is never offered (it hides a tour for good). */
const STATUS_ACTIONS: StatusAction[] = [
  { status: "published", label: "Đăng bán", done: "Tour đã được đăng bán." },
  { status: "paused", label: "Ẩn tour", done: "Tour đã được ẩn khỏi trang khách hàng." },
  { status: "draft", label: "Chuyển về nháp", done: "Tour đã chuyển về bản nháp." },
];

/** Every settable status except the current one; an archived tour gets none. */
export function statusActionsFor(status: TourStatus): StatusAction[] {
  return status === "archived" ? [] : STATUS_ACTIONS.filter(action => action.status !== status);
}

/**
 * Branches offered in the "chi nhánh điều hành" select: those the operator may manage, plus the tour's current
 * branch so an existing tour never shows an empty select.
 */
export function branchOptions(branches: BranchLookup[], currentId = ""): BranchLookup[] {
  return branches.filter(branch => branch.canManage || branch.id === currentId);
}
