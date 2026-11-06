export type AuthUser = {
  id: string; fullName: string; email: string; phone: string | null;
  roles: { code: string; scope: string; regionId: string | null; branchId: string | null }[];
};
export type Session = { user: AuthUser; expiresAt: string };

export async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  // One deadline includes CSRF, the request and reading the response body.
  const signal = AbortSignal.timeout(12_000);
  let token: string | undefined;
  if (body !== undefined) {
    const csrf = await fetch("/api/auth/csrf", { cache: "no-store", credentials: "same-origin", signal });
    if (!csrf.ok) throw new Error("Không thể khởi tạo phiên. Vui lòng thử lại.");
    token = (await csrf.json()).token;
  }
  const response = await fetch(`/api/auth/${path}`, {
    method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store",
    signal,
    headers: body === undefined ? undefined : { "Content-Type": "application/json", "X-CSRF-Token": token! },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(error => { if (signal.aborted) throw error; return null; });
  if (!response.ok) {
    if (response.status === 401 && path === "me") return null as T;
    const validation = data?.errors ? Object.values(data.errors).flat().join(" ") : null;
    throw new Error(response.status === 429 ? "Bạn đã thử quá nhiều lần. Vui lòng chờ một phút."
      : response.status >= 500 ? "Dịch vụ tài khoản đang gián đoạn. Vui lòng thử lại."
      : data?.message || validation || "Yêu cầu không thành công. Vui lòng thử lại.");
  }
  return data;
}

export function safeReturnPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/account";
}
