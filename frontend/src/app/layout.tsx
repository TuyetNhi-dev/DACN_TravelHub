import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";
import "../styles/coastal.css";
import { themeInitScript } from "@/lib/theme";
import { DepartureProvider } from "@/components/departure/DepartureProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
const font = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600", "700", "800"], variable: "--font-be-vietnam-pro", display: "swap" });
export const metadata: Metadata = { title: "SàiHành — Đi để cảm nhiều hơn", description: "SàiHành — Đi để cảm nhiều hơn. Khám phá tour du lịch, khách sạn và vé máy bay nội địa Việt Nam." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="vi" className={font.variable} data-scroll-behavior="smooth" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /></head><body id="top"><AuthProvider><DepartureProvider><LinkSkip /><Header />{children}<Footer /></DepartureProvider></AuthProvider></body></html>;
}
function LinkSkip() { return <a className="skip-link" href="#main-content">Đến nội dung chính</a>; }
