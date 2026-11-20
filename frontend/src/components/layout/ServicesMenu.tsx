"use client";

import Link from "next/link";
import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import { EXTRA_SERVICES, serviceHref } from "@/data/extra-services";
import { useDisclosureMenu } from "@/hooks/useDisclosureMenu";
import { isCurrentPath } from "@/lib/disclosure-menu";

/**
 * "Dịch vụ cộng thêm" in the main navigation. Desktop: a dropdown panel; inside the mobile hamburger panel the
 * same markup becomes an expandable group (CSS). Pattern: WAI-ARIA disclosure navigation.
 */
export function ServicesMenu({ pathname, onNavigate }: { pathname: string; onNavigate: () => void }) {
  const {
    open, wrapperRef, triggerRef, close, onTriggerClick, onTriggerKeyDown, onPanelKeyDown, onPointerEnter,
    onPointerLeave, onBlur,
  } = useDisclosureMenu(pathname);
  const panelId = useId();
  const active = EXTRA_SERVICES.some(service => isCurrentPath(pathname, serviceHref(service.slug)));

  return (
    <div ref={wrapperRef} className={`svc-menu${open ? " is-open" : ""}`} onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave} onBlur={onBlur}>
      <button ref={triggerRef} type="button" className={`svc-menu-trigger${active ? " active" : ""}`}
        aria-expanded={open} aria-controls={panelId} aria-label="Dịch vụ cộng thêm"
        onClick={onTriggerClick} onKeyDown={onTriggerKeyDown}>
        <span className="svc-menu-label-full">Dịch vụ cộng thêm</span>
        <span className="svc-menu-label-short" aria-hidden="true">Dịch vụ</span>
        <Icon name="chevron" size={16} />
      </button>
      <div id={panelId} className="svc-menu-panel" hidden={!open} onKeyDown={onPanelKeyDown}>
        <ul>
          {EXTRA_SERVICES.map(service => {
            const href = serviceHref(service.slug);
            const current = isCurrentPath(pathname, href);
            return (
              <li key={service.slug}>
                <Link href={href} data-menu-item="" className={`svc-menu-link${current ? " is-current" : ""}`}
                  aria-current={current ? "page" : undefined}
                  onClick={() => { close(false); onNavigate(); }}>
                  <span className={`svc-tile svc-menu-tile svc-tone--${service.tone}`} aria-hidden="true">
                    <Icon name={service.icon} size={20} />
                  </span>
                  <span className="svc-menu-text">
                    <b>{service.name}</b>
                    <small>{service.summary}</small>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
