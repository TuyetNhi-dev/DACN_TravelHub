"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminBreadcrumb } from "@/lib/admin-nav";

export function AdminBreadcrumb() {
  const crumbs = adminBreadcrumb(usePathname());
  return (
    <nav className="adm-breadcrumb" aria-label="Đường dẫn">
      <ol>{crumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`}>
        {crumb.href && index !== crumbs.length - 1 ? <Link href={crumb.href}>{crumb.label}</Link> :
          <span aria-current={index === crumbs.length - 1 ? "page" : undefined}>{crumb.label}</span>}
      </li>)}</ol>
    </nav>
  );
}
