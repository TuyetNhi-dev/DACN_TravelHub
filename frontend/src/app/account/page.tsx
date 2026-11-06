import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AccountPanel } from "@/components/auth/AccountPanel";
export const metadata = { title: "Tài khoản | SàiHành", robots: { index: false, follow: false } };
export default async function AccountPage() {
  const jar = await cookies();
  const base = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5108").replace(/\/$/, "");
  let response: Response;
  try { response = await fetch(`${base}/api/auth/me`, { headers: { Cookie: jar.toString() }, cache: "no-store", signal: AbortSignal.timeout(12000) }); }
  catch { return <main id="main-content" className="container auth-page"><p role="alert">Dịch vụ tài khoản đang gián đoạn. Vui lòng tải lại trang.</p></main>; }
  if (response.status === 401) redirect(jar.has("SaiHanh.Session") ? "/login?next=/account&expired=1" : "/login?next=/account");
  if (!response.ok) return <main id="main-content" className="container auth-page"><p role="alert">Không thể kiểm tra phiên. Vui lòng tải lại trang.</p></main>;
  return <AccountPanel />;
}
