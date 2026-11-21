import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { TermsGate } from "@/components/auth/TermsGate";
import { CartProvider } from "@/components/cart/CartProvider";
import { DepartureProvider } from "@/components/departure/DepartureProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";
import "../styles/coastal.css";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SàiHành — Đi để cảm nhiều hơn",
  description: "SàiHành — Đi để cảm nhiều hơn. Khám phá tour du lịch, khách sạn và vé máy bay nội địa Việt Nam.",
};

// "cover" lets fixed bars reach the iPhone screen edge; they pad themselves with env(safe-area-inset-*).
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Scroll-reveal content starts hidden and is shown by JavaScript; without it, show everything.
const NO_SCRIPT_CSS = ".reveal .ui-section-head, .reveal [data-reveal-item] "
  + "{ opacity: 1 !important; transform: none !important; }";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi" className={font.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <noscript><style>{NO_SCRIPT_CSS}</style></noscript>
      </head>
      <body id="top">
        <AuthProvider>
          <CartProvider>
            <DepartureProvider>
              <a className="skip-link" href="#main-content">Đến nội dung chính</a>
              <Header />
              <TermsGate>{children}</TermsGate>
              <Footer />
            </DepartureProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
