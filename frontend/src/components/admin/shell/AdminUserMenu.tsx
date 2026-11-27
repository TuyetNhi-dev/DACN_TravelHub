"use client";

import { useAdmin } from "./AdminProvider";

export function AdminUserMenu() {
  const { context } = useAdmin();
  return (
    <span className="adm-user-name">{context.fullName}<small>{context.role}</small></span>
  );
}
