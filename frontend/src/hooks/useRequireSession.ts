"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { loginHref } from "@/lib/auth";

/** Sends visitors to the login page and back here afterwards. The API still rejects anonymous calls. */
export function useRequireSession() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mustLogin = !auth.loading && !auth.session && !auth.error;

  useEffect(() => {
    if (mustLogin) router.replace(loginHref(pathname + window.location.search));
  }, [mustLogin, pathname, router]);

  return auth;
}
