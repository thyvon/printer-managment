const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const tokenStore = {
  get: () => (typeof window !== "undefined" ? localStorage.getItem("mps_token") : null),
  set: (token: string) => localStorage.setItem("mps_token", token),
  clear: () => localStorage.removeItem("mps_token"),
};

export function isAuthenticated() {
  return tokenStore.get() !== null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = tokenStore.get();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body?.message ?? Object.values(body?.errors ?? {}).flat().join(", ") ?? "Request failed";
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};