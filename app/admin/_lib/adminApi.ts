import { toast } from "sonner";
import type {
  AdminHealthData,
  AdminPlansData,
  AdminPlanUpdatePayload,
  DashboardCardsData,
  DashboardStatsData,
  RecentErrorsData,
} from "./types";

const TOKEN_KEY = "admin_token";

function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

function adminUrl(path: string) {
  const base = getApiBase();
  if (!base) return "";
  const segment = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/api/admin/${segment}`;
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
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  auth?: boolean;
};

export async function adminFetch<T = unknown>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<{ data?: T; error?: string; status?: number }> {
  const url = adminUrl(path);
  if (!url) {
    return { error: "API URL is not configured", status: 0 };
  }

  const method = opts.method ?? "GET";
  const useAuth = opts.auth !== false;

  const entries = Object.entries(opts.query ?? {}).filter(
    ([, v]) => v != null && v !== "",
  );
  let fetchUrl = url;
  if (entries.length) {
    const params = new URLSearchParams();
    for (const [k, v] of entries) params.set(k, String(v));
    fetchUrl += `?${params.toString()}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = getAdminToken();
  if (useAuth && token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(fetchUrl, {
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
      if (res.status === 401 && typeof window !== "undefined" && useAuth) {
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

export type AdminLoginResponse = {
  token: string;
  expires_in?: string;
  token_type?: string;
  admin?: {
    id?: string;
    email?: string;
    name?: string;
  };
};

export const adminApi = {
  login: (email: string, password: string) =>
    adminFetch<AdminLoginResponse>("auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),
  me: () => adminFetch("auth/me"),
  dashboardStats: () => adminFetch<DashboardStatsData>("dashboard/stats"),
  dashboardCards: () => adminFetch<DashboardCardsData>("dashboard/cards"),
  recentErrors: (limit = 10) =>
    adminFetch<RecentErrorsData>("logs/recent-errors", {
      query: { limit },
    }),
  clients: (query?: Record<string, string | number | undefined>) =>
    adminFetch("clients", { query }),
  client: (storeHash: string) => adminFetch(`clients/${encodeURIComponent(storeHash)}`),
  workers: () => adminFetch("workers"),
  workerQueues: () => adminFetch("workers/queues"),
  logs: (query?: Record<string, string | number | undefined>) =>
    adminFetch("logs", { query }),
  logsSummary: () => adminFetch("logs/summary"),
  serverHealth: () => adminFetch<AdminHealthData>("health"),
  serverHealthLite: () => adminFetch("health/lite"),
  plans: () => adminFetch<AdminPlansData>("plans"),
  updatePlans: (plans: AdminPlanUpdatePayload[]) =>
    adminFetch<AdminPlansData>("plans", {
      method: "PUT",
      body: { plans },
    }),
};
