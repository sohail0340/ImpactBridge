// If VITE_API_URL is set (e.g. on Vercel), use it as the absolute API origin.
// Otherwise fall back to the same-origin path-based prefix used on Replit.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)
  ? `${(import.meta.env.VITE_API_URL as string).replace(/\/+$/, "")}/api`
  : `${import.meta.env.BASE_URL}api`.replace(/\/+$/, "").replace(/\/api\/api$/, "/api");

const TOKEN_KEY = "impactbridge:token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}
