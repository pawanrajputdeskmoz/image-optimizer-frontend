import { toast } from "sonner";

const TOKEN_KEY = "admin_token";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
}

export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY)?.trim() ?? "";
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type AdminFetchOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  auth?: boolean;
};

export async function adminFetch<T = unknown>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<{ data?: T; error?: string; status?: number }> {
  const base = getBaseUrl();
  if (!base) {
    return { error: "API URL is not configured", status: 0 };
  }

  const method = opts.method ?? "GET";
  const useAuth = opts.auth !== false;
  let url = `${base}/admin/monitoring${path.startsWith("/") ? path : `/${path}`}`;

  const entries = Object.entries(opts.query ?? {}).filter(
    ([, v]) => v != null && v !== "",
  );
  if (entries.length) {
    const params = new URLSearchParams();
    for (const [k, v] of entries) params.set(k, String(v));
    url += `?${params.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = getAdminToken();
  if (useAuth && token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body:
        method !== "GET" && opts.body != null
          ? JSON.stringify(opts.body)
          : undefined,
    });

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      data?: T;
    };

    if (!res.ok || json.success === false) {
      const message = json.message || `Request failed (${res.status})`;
      if (res.status === 401 && typeof window !== "undefined") {
        clearAdminToken();
        window.location.href = "/admin/monitoring/login";
        return { error: message, status: res.status };
      }
      if (res.status !== 401) toast.error(message);
      return { error: message, status: res.status };
    }

    return { data: json.data as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    toast.error(message);
    return { error: message, status: 0 };
  }
}

export const adminApi = {
  login: (email: string, password: string) =>
    adminFetch<{ token: string; email: string; role: string }>("/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),
  dashboard: () => adminFetch("/dashboard"),
  serverHealth: () => adminFetch("/server-health"),
  workers: () => adminFetch("/workers"),
  workerAction: (workerName: string, action: string) =>
    adminFetch(`/workers/${encodeURIComponent(workerName)}/action`, {
      method: "POST",
      body: { action },
    }),
  logs: (query: Record<string, string | number | undefined>) =>
    adminFetch("/logs", { query }),
  log: (id: string) => adminFetch(`/logs/${id}`),
  failedJobs: (query: Record<string, string | number | undefined>) =>
    adminFetch("/failed-jobs", { query }),
  retryFailedJob: (id: string) =>
    adminFetch(`/failed-jobs/${id}/retry`, { method: "POST" }),
  ignoreFailedJob: (id: string) =>
    adminFetch(`/failed-jobs/${id}/ignore`, { method: "POST" }),
  alerts: (query: Record<string, string | number | undefined>) =>
    adminFetch("/alerts", { query }),
  alert: (id: string) => adminFetch(`/alerts/${id}`),
  resolveAlert: (id: string) =>
    adminFetch(`/alerts/${id}/resolve`, { method: "POST" }),
  muteAlert: (id: string) =>
    adminFetch(`/alerts/${id}/mute`, { method: "POST" }),
  imageStats: (query: Record<string, string | number | undefined>) =>
    adminFetch("/image-stats", { query }),
  imageStatsSummary: (query: Record<string, string | number | undefined>) =>
    adminFetch("/image-stats/summary", { query }),
};
