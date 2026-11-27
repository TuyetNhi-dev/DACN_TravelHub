"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AssistantLauncher } from "@/components/assistant/AssistantLauncher";
import { TermsGate } from "@/components/auth/TermsGate";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdmin) return <TermsGate>{children}</TermsGate>;
  return <>
    <a className="skip-link" href="#main-content">Đến nội dung chính</a>
    <Header />
    <TermsGate>{children}</TermsGate>
    <Footer />
    <AssistantLauncher />
  </>;
}
