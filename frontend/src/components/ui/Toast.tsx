"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "./Icon";

const AUTO_HIDE_MS = 6000;

interface ToastProps {
  message: string;
  action?: { href: string; label: string };
  onClose: () => void;
}

/**
 * Small notice at the bottom of the screen (above the phone booking bar). It is a polite live region, so
 * screen readers announce it without moving focus, and it hides itself after a few seconds.
 */
export function Toast({ message, action, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="ui-toast" role="status" aria-live="polite">
      <span className="ui-toast-icon" aria-hidden="true"><Icon name="check" size={18} /></span>
      <p>{message}</p>
      {action && <Link href={action.href} onClick={onClose}>{action.label}</Link>}
      <button type="button" onClick={onClose} aria-label="Đóng thông báo"><Icon name="close" size={18} /></button>
    </div>
  );
}
