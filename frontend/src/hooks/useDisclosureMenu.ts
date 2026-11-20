"use client";

import {
  useEffect, useRef, useState, type Dispatch, type FocusEvent, type KeyboardEvent, type RefObject, type SetStateAction,
} from "react";
import { CLOSE_DELAY_MS, afterClick, nextItemIndex, triggerKeyAction } from "@/lib/disclosure-menu";

/** Hover-to-open only where there is a real pointer and the desktop header (the hamburger panel covers <= 1219px). */
const HOVER_DESKTOP = "(hover: hover) and (min-width: 1220px)";
const ITEM_SELECTOR = "[data-menu-item]";
const CLOSED = { open: false, pinned: false };

type MenuState = { open: boolean; pinned: boolean };
type Edge = "first" | "last";

const isHoverDesktop = () => window.matchMedia(HOVER_DESKTOP).matches;

/**
 * Disclosure navigation menu: hover opens (closing after a short delay), click pins it open, a click outside,
 * Escape or tabbing away closes it. Arrow keys, Home and End move between the links.
 */
export function useDisclosureMenu(pathname: string) {
  const [state, setState] = useState<MenuState>(CLOSED);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<Edge | null>(null);
  const hover = useHoverOpen(state.pinned, setState);

  // Navigating to another page closes the menu.
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setState(CLOSED);
  }

  useCloseOnOutsidePointer(state.open, wrapperRef, () => setState(CLOSED));

  // Focus requested together with opening is applied once the panel is visible.
  useEffect(() => {
    if (!state.open || !pendingFocus.current) return;
    focusEdge(wrapperRef.current, pendingFocus.current);
    pendingFocus.current = null;
  }, [state.open]);

  function close(returnFocus: boolean) {
    hover.cancel();
    setState(CLOSED);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onTriggerClick() {
    hover.cancel();
    setState(afterClick);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const action = triggerKeyAction(event.key, state.open);
    if (!action) return;
    event.preventDefault();
    if (action === "close") return close(true);
    const edge = action === "open-first" ? "first" : "last";
    if (state.open) return focusEdge(wrapperRef.current, edge);
    pendingFocus.current = edge;
    setState({ open: true, pinned: true });
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      return close(true);
    }
    const items = menuItems(wrapperRef.current);
    const index = nextItemIndex(items.indexOf(document.activeElement as HTMLElement), event.key, items.length);
    if (index === null) return;
    event.preventDefault();
    items[index]?.focus();
  }

  /** Tabbing out of the menu closes it on desktop; in the mobile panel the group stays as the visitor left it. */
  function onBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null;
    if (next && !wrapperRef.current?.contains(next) && isHoverDesktop()) close(false);
  }

  return {
    open: state.open, wrapperRef, triggerRef, close, onTriggerClick, onTriggerKeyDown, onPanelKeyDown,
    onPointerEnter: hover.onPointerEnter, onPointerLeave: hover.onPointerLeave, onBlur,
  };
}

/** Pointer hover on desktop: open at once, close after CLOSE_DELAY_MS unless the menu was pinned by a click. */
function useHoverOpen(pinned: boolean, setState: Dispatch<SetStateAction<MenuState>>) {
  const timer = useRef<number | null>(null);
  useEffect(() => () => clearTimer(timer), []);
  return {
    cancel: () => clearTimer(timer),
    onPointerEnter() {
      if (!isHoverDesktop()) return;
      clearTimer(timer);
      setState(current => (current.open ? current : { open: true, pinned: false }));
    },
    onPointerLeave() {
      if (!isHoverDesktop() || pinned) return;
      clearTimer(timer);
      timer.current = window.setTimeout(() => setState(CLOSED), CLOSE_DELAY_MS);
    },
  };
}

/** A pointer press anywhere outside the menu closes it. */
function useCloseOnOutsidePointer(open: boolean, wrapperRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) onCloseRef.current();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, wrapperRef]);
}

function focusEdge(wrapper: HTMLElement | null, edge: Edge) {
  const items = menuItems(wrapper);
  (edge === "first" ? items[0] : items[items.length - 1])?.focus();
}

function menuItems(wrapper: HTMLElement | null): HTMLElement[] {
  return wrapper ? Array.from(wrapper.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
}

function clearTimer(timer: { current: number | null }) {
  if (timer.current !== null) window.clearTimeout(timer.current);
  timer.current = null;
}
