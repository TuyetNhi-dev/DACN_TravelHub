/**
 * Keyboard and pointer rules of the "Dịch vụ cộng thêm" header menu (WAI-ARIA disclosure navigation:
 * a button with aria-expanded that shows a list of links; not role="menu"). Pure, so it is unit tested.
 */

/** Delay before a hover-opened menu closes, so moving the pointer from the button to the panel keeps it open. */
export const CLOSE_DELAY_MS = 200;

/** Index of the item that should get focus, or null when the key is not a navigation key. -1 = the button. */
export function nextItemIndex(current: number, key: string, count: number): number | null {
  if (count <= 0) return null;
  switch (key) {
    case "ArrowDown": return current < 0 ? 0 : (current + 1) % count;
    case "ArrowUp": return current <= 0 ? count - 1 : current - 1;
    case "Home": return 0;
    case "End": return count - 1;
    default: return null;
  }
}

export type TriggerAction = "toggle-pin" | "open-first" | "open-last" | "close" | null;

/** What a key on the menu button does (Enter/Space are native button clicks and come in as a click). */
export function triggerKeyAction(key: string, open: boolean): TriggerAction {
  if (key === "ArrowDown") return "open-first";
  if (key === "ArrowUp") return "open-last";
  if (key === "Escape" && open) return "close";
  return null;
}

/**
 * Click on the button: a hover-opened menu becomes pinned (stays open when the pointer leaves);
 * a pinned menu closes.
 */
export function afterClick(state: { open: boolean; pinned: boolean }): { open: boolean; pinned: boolean } {
  return state.open && state.pinned ? { open: false, pinned: false } : { open: true, pinned: true };
}

/** The service page the visitor is on, for aria-current and the active style. */
export function isCurrentPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
