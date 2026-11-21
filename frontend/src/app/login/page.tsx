import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = { title: "Đăng nhập | SàiHành", robots: { index: false, follow: false } };

const SESSION_EXPIRED = "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.";
/** Shown after /quen-mat-khau sends the user here with ?reset=1. */
const PASSWORD_RESET_NOTICE = "Đã đặt mật khẩu mới thành công. Vui lòng đăng nhập bằng mật khẩu mới.";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const notice = query.reset === "1" ? PASSWORD_RESET_NOTICE : query.expired === "1" ? SESSION_EXPIRED : "";
  return <AuthForm mode="login" notice={notice} />;
}
