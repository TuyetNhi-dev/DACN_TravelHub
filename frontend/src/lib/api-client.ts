/** The only module that calls fetch. Requests go to the same-origin /api proxy (see next.config.ts). */

const REQUEST_TIMEOUT_MS = 12_000;
const CSRF_PATH = "/api/auth/csrf";
const CSRF_HEADER = "X-CSRF-Token";

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly fieldErrors: FieldErrors = {},
    /** Machine-readable reason from the problem JSON "code", e.g. "email_not_verified". */
    public readonly code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  signal?: AbortSignal;
}

export function apiGet(path: string, signal?: AbortSignal): Promise<unknown> {
  return apiRequest(path, { signal });
}

export function apiPost(path: string, body: unknown = {}, signal?: AbortSignal): Promise<unknown> {
  return apiRequest(path, { method: "POST", body, signal });
}

async function apiRequest(path: string, { method = "GET", body, signal }: RequestOptions): Promise<unknown> {
  // One deadline covers the CSRF round trip, the request and reading the body.
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers[CSRF_HEADER] = await fetchCsrfToken(combined);
  }
  let response: Response;
  try {
    response = await fetch(path, {
      method, headers, signal: combined, cache: "no-store", credentials: "same-origin",
      body: body === undefined || method === "GET" ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.");
  }
  const data = await readBody(response, combined, signal);
  if (!response.ok) throw toApiError(response.status, data);
  return data;
}

/**
 * An empty or non-JSON body reads as null, but a body cut off by the deadline or a caller abort must
 * fail: otherwise a timed-out request would look like a successful empty response.
 */
async function readBody(response: Response, combined: AbortSignal, caller?: AbortSignal): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    if (caller?.aborted) throw error;
    if (combined.aborted) throw new ApiError("Máy chủ phản hồi quá lâu. Vui lòng thử lại.");
    return null;
  }
}

async function fetchCsrfToken(signal: AbortSignal): Promise<string> {
  const response = await fetch(CSRF_PATH, { cache: "no-store", credentials: "same-origin", signal });
  const data: unknown = await response.json().catch(() => null);
  const token = isRecord(data) && typeof data.token === "string" ? data.token : null;
  if (!response.ok || !token) throw new ApiError("Không thể khởi tạo phiên làm việc. Vui lòng tải lại trang.");
  return token;
}

/** Maps the backend's RFC 7807 problem JSON to a user-facing Vietnamese message. */
function toApiError(status: number, data: unknown): ApiError {
  const problem = isRecord(data) ? data : {};
  const fieldErrors = readFieldErrors(problem.errors);
  const firstFieldError = Object.values(fieldErrors).flat()[0];
  if (status === 429) return new ApiError("Bạn thao tác quá nhanh. Vui lòng chờ một phút rồi thử lại.", status);
  if (status >= 500) return new ApiError("Hệ thống đang gián đoạn. Vui lòng thử lại sau.", status);
  const detail = typeof problem.detail === "string" ? problem.detail : null;
  const code = typeof problem.code === "string" ? problem.code : null;
  return new ApiError(firstFieldError || detail || "Yêu cầu không thành công.", status, fieldErrors, code);
}

function readFieldErrors(value: unknown): FieldErrors {
  if (!isRecord(value)) return {};
  const entries = Object.entries(value)
    .map(([key, messages]) => [key, Array.isArray(messages) ? messages.filter(m => typeof m === "string") : []]);
  return Object.fromEntries(entries);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
