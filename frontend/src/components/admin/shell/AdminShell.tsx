"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { OperatorGate } from "../OperatorGate";
import { AdminProvider } from "./AdminProvider";
import { AdminScopePicker } from "./AdminScopePicker";
import { AdminSidebar } from "./AdminSidebar";
import { AdminUserMenu } from "./AdminUserMenu";
import { AdminBreadcrumb } from "./AdminBreadcrumb";
import { adminBreadcrumb } from "@/lib/admin-nav";
import { usePathname } from "next/navigation";

/**
 * Frame of every /admin page. The gate runs first so a customer never calls GET /api/admin/context; the provider
 * then loads the operator's scopes once for all pages instead of once per page.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="adm-layout">
      <OperatorGate>
        <AdminProvider>
          <AdminFrame>{children}</AdminFrame>
        </AdminProvider>
      </OperatorGate>
    </div>
  );
}

function AdminFrame({ children }: { children: ReactNode }) {
  // Phones and tablets show the menu as a panel under the top bar; desktop always shows it beside the page.
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const crumbs = adminBreadcrumb(pathname);
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? "Quản trị";

  function closeOnEscape(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && menuOpen) setMenuOpen(false);
  }

  return (
    <div className="adm-shell" onKeyDown={closeOnEscape}>
      <header className="adm-topbar">
        <button type="button" className="adm-menu-toggle" aria-controls="admin-sidebar" aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}>
          <Icon name={menuOpen ? "close" : "menu"} size={18} />
          <span className="sr-only">Menu quản trị</span>
        </button>
        <strong className="adm-topbar-title">{pageTitle}</strong>
        <AdminScopePicker />
        <AdminUserMenu />
      </header>
      {menuOpen && <button type="button" className="adm-sidebar-backdrop" aria-label="Đóng menu"
        onClick={() => setMenuOpen(false)} />}
      <AdminSidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      <div className="adm-content"><AdminBreadcrumb />{children}</div>
    </div>
  );
}
