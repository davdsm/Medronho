/** Cliente mínimo da API (mesma origem; em desenvolvimento o Vite faz proxy). */
export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

let onUnauthorized: (() => void) | null = null;
/** O backoffice regista aqui o que fazer quando a sessão expira (HTTP 401 em /admin). */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export async function api<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const headers: Record<string, string> = { "X-Requested-With": "XMLHttpRequest" };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload, credentials: "same-origin", signal });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "Não foi possível contactar o servidor.");
  }
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* sem corpo JSON */
  }
  if (res.status === 401 && path.startsWith("/admin")) onUnauthorized?.();
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; fields?: Record<string, string> };
    throw new ApiError(res.status, d.error ?? `Erro ${res.status}`, d.fields);
  }
  return data as T;
}
