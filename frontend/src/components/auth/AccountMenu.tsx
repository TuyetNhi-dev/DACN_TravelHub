"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDisclosureMenu } from "@/hooks/useDisclosureMenu";
import { nameInitials } from "@/lib/auth";
import type { AuthUser } from "@/types/auth";
import { AccountLinks } from "./AccountLinks";

interface AccountMenuProps {
  user: AuthUser;
  pathname: string;
  newRequests: number;
}

/**
 * Desktop header: one avatar button (initials + chevron) instead of name, "Đơn của tôi" and "Đăng xuất" side
 * by side, so a long name can never push the header wider than the screen. Opens on click only (no hover):
 * Esc, a click outside and the arrow keys come from useDisclosureMenu.
 */
export function AccountMenu({ user, pathname, newRequests }: AccountMenuProps) {
  const { open, wrapperRef, triggerRef, close, onTriggerClick, onTriggerKeyDown, onPanelKeyDown, onBlur } =
    useDisclosureMenu(pathname);
  const panelId = useId();
  return (
    <div ref={wrapperRef} className={`account-menu${open ? " is-open" : ""}`} onBlur={onBlur}>
      <button ref={triggerRef} type="button" className="account-trigger" aria-expanded={open}
        aria-controls={panelId} aria-label={`Tài khoản: ${user.fullName}`} title={user.fullName}
        onClick={onTriggerClick} onKeyDown={onTriggerKeyDown}>
        <span className="auth-avatar" aria-hidden="true">{nameInitials(user.fullName)}</span>
        {/* A dot tells staff there is something new without opening the menu. */}
        {newRequests > 0 && <span className="account-trigger-dot" aria-hidden="true" />}
        <Icon name="chevron" size={16} />
      </button>
      <div id={panelId} className="account-panel" hidden={!open} onKeyDown={onPanelKeyDown}>
        <AccountLinks user={user} pathname={pathname} newRequests={newRequests} onNavigate={() => close(false)} />
      </div>
    </div>
  );
}
