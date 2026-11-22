"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { navigation } from "@/data/home";
import { ThemeToggle } from "./ThemeToggle";
import { HeaderSearch } from "./HeaderSearch";
import { ServicesMenu } from "./ServicesMenu";
import { AuthActions } from "@/components/auth/AuthActions";
import { CartButton } from "@/components/cart/CartButton";
import { useNewRequestCount } from "@/hooks/useNewRequestCount";

/** The longest matching link wins, so /flights/deals marks "Săn vé rẻ" and not also "Vé máy bay". */
function activeHref(pathname: string): string | undefined {
  if (pathname === "/") return "/";
  return navigation
    .filter(item => item.href !== "/" && !item.href.includes("#"))
    .filter(item => pathname === item.href || pathname.startsWith(item.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = activeHref(pathname);
  const { count: newRequests } = useNewRequestCount();
  return <>
    <nav id="main-navigation" aria-label="Điều hướng chính" className={open ? "nav-links open" : "nav-links"}>
      {navigation.map(item => (
        <Link key={item.label} href={item.href} aria-current={item.href === current ? "page" : undefined}
          aria-label={item.ariaLabel} className={item.href === current ? "active" : ""}
          onClick={() => setOpen(false)}>
          {item.label}
          {item.badge && <span className="nav-badge" aria-hidden="true">{item.badge}</span>}
        </Link>
      ))}
      <ServicesMenu pathname={pathname} onNavigate={() => setOpen(false)} />
      <div className="mobile-auth">
        <AuthActions variant="panel" newRequests={newRequests} onNavigate={() => setOpen(false)} />
      </div>
    </nav>
    <HeaderSearch />
    <CartButton pathname={pathname} />
    <div className="nav-actions"><AuthActions newRequests={newRequests} /></div>
    <ThemeToggle />
    <button className="menu-btn" aria-expanded={open} aria-controls="main-navigation"
      aria-label={open ? "Đóng menu" : "Mở menu"} onClick={() => setOpen(!open)}
      onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
      <Icon name={open ? "close" : "menu"} />
    </button>
  </>;
}
