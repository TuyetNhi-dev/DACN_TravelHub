import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = { title: "Đăng nhập | SàiHành", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  return <AuthForm mode="login" sessionExpired={query.expired === "1"} />;
}
