import type { ApiResponse, PaginatedResponse } from "@/types/api";
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public messages: string[],
  ) {
    super(messages.join(", "));
    this.name = "ApiError";
  }
}
// BFF server-only menyisipkan Bearer. Token tidak pernah diekspos ke session browser.
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
  paginated = false,
): Promise<T> {
  const res = await fetch("/api/gateway" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    signal: AbortSignal.timeout(20000),
  });
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status, ["Respons server tidak valid"]);
  }
  if (!res.ok) {
    const message =
      typeof json === "object" && json !== null && "message" in json
        ? json.message
        : "Request gagal";
    throw new ApiError(
      res.status,
      Array.isArray(message) ? message.map(String) : [String(message)],
    );
  }
  if (paginated) {
    const data = json as PaginatedResponse<unknown>;
    return { data: data.data, meta: data.meta } as T;
  }
  return (json as ApiResponse<T>).data;
}
export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  getPaginated: <T>(path: string) =>
    request<{ data: T[]; meta: PaginatedResponse<T>["meta"] }>(
      path,
      "GET",
      undefined,
      true,
    ),
  post: <T>(path: string, body: unknown) => request<T>(path, "POST", body),
  put: <T>(path: string, body: unknown) => request<T>(path, "PUT", body),
  patch: <T>(path: string, body: unknown) => request<T>(path, "PATCH", body),
  delete: <T>(path: string) => request<T>(path, "DELETE"),
};
