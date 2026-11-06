import { AuthForm } from "@/components/auth/AuthForm";
export const metadata = { title: "Đăng ký | SàiHành", robots: { index: false, follow: false } };
export default function RegisterPage() { return <AuthForm mode="register" />; }
