"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { navigation } from "@/data/home";
import { ThemeToggle } from "./ThemeToggle";
import { HeaderSearch } from "./HeaderSearch";
import { AuthActions } from "@/components/auth/AuthActions";
export function Navigation() {
 const [open, setOpen] = useState(false);
 const pathname = usePathname();
 return <>
 <nav id="main-navigation" aria-label="Điều hướng chính" className={open ? "nav-links open" : "nav-links"}>
 {navigation.map(item => { const active = item.href === "/" ? pathname === "/" : !item.href.includes("#") && (pathname === item.href || pathname.startsWith(item.href + "/")); return <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={active ? "active" : ""} onClick={() => setOpen(false)}>{item.label}</Link>; })}
 <div className="mobile-auth"><AuthActions onNavigate={() => setOpen(false)} /></div>
 </nav>
 <HeaderSearch />
 <div className="nav-actions"><AuthActions /></div>
 <ThemeToggle />
 <button className="menu-btn" aria-expanded={open} aria-controls="main-navigation" aria-label={open ? "Đóng menu" : "Mở menu"} onClick={() => setOpen(!open)} onKeyDown={e => { if(e.key === "Escape") setOpen(false); }}><Icon name={open ? "close" : "menu"} /></button>
 </>;
}
