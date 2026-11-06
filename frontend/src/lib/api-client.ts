export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

/** Only a public API URL belongs in frontend configuration; never database credentials. */
export async function apiGet(path: string, signal?: AbortSignal): Promise<unknown> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!base) throw new ApiError("Chưa cấu hình địa chỉ API.");
  let url: URL;
  try {
    url = new URL(base.replace(/\/$/, "") + path);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
      throw new Error("Invalid URL");
  } catch {
    throw new ApiError("Địa chỉ API chưa hợp lệ.");
  }
  const timeout = AbortSignal.timeout(12000);
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  // Do not forward backend exception details or internal URLs into the UI.
  if (!response.ok) throw new ApiError("Không thể tải dữ liệu tour.", response.status);
  return response.json();
}
