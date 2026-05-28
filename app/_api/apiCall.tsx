import { toast } from "sonner";

function getStoredApiToken(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return (
    localStorage.getItem("api-token")?.trim() ||
    localStorage.getItem("access_token")?.trim() ||
    localStorage.getItem("token")?.trim() ||
    ""
  );
}

function getStoredChannelId(): number {
  if (typeof window === "undefined") {
    return 1;
  }
  try {
    const raw = localStorage.getItem("channel");
    if (!raw) return 1;
    const parsed = JSON.parse(raw) as { channel_id?: number | string };
    const id = parsed?.channel_id;
    if (typeof id === "number") return id;
    if (typeof id === "string" && id.trim() !== "") {
      const n = Number(id);
      return Number.isFinite(n) ? n : 1;
    }
    return 1;
  } catch {
    return 1;
  }
}

function showApiErrorToast(status: number, message?: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (status >= 500) {
    toast.error("Something went wrong");
    return;
  }

  const trimmed = (message ?? "").trim();
  toast.error(trimmed || "Request failed");
}

export type ApiCallOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Skip shop/channel_id/store_id merge — send JSON body as you pass it */
  rawBody?: boolean;
  /** Appended as URL query string, e.g. ?query=shirt */
  query?: Record<string, string | number | boolean | null | undefined>;
};

export async function ApiCall(
  url: string,
  body: unknown = {},
  opts?: ApiCallOptions,
) {
  const method = opts?.method ?? "POST";
  const rawBody = opts?.rawBody ?? false;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

  if (!base) {
    return { error: "API URL is not configured", status: 0 };
  }

  try {
    const apiToken = getStoredApiToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "app-key": `${process.env.NEXT_PUBLIC_API_KEY}`,
      "app-activant": "activantfrontend",
    };

    if (apiToken) {
      headers.Authorization = `Bearer ${apiToken}`;
    }

    const path = url.replace(/^\//, "");
    let fetchUrl = `${base}/api/${path}`;

    if (opts?.query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(opts.query)) {
        if (value == null || value === "") {
          continue;
        }
        params.set(key, String(value));
      }
      const qs = params.toString();
      if (qs) {
        fetchUrl += `?${qs}`;
      }
    }

    const init: RequestInit = { method, headers };

    if (method !== "GET") {
      if (rawBody) {
        init.body = JSON.stringify(body ?? {});
      } else {
        const channelId = getStoredChannelId();
        const payload: Record<string, unknown> = {
          ...(body as Record<string, unknown>),
          shop:
            typeof window !== "undefined"
              ? localStorage.getItem("shop")
              : null,
          channel_id: channelId,
          store_id:
            typeof window !== "undefined"
              ? localStorage.getItem("user_id")
              : null,
        };
        init.body = JSON.stringify(payload);
      }
    }

    const response = await fetch(fetchUrl, init);

    if (!response.ok) {
      let message = "";

      try {
        const data = (await response.json()) as {
          message?: string;
          error?: string;
          errors?: unknown;
        };
        message =
          data?.message ||
          data?.error ||
          (typeof data?.errors === "string" ? data.errors : "");
      } catch {
        try {
          message = await response.text();
        } catch {
          message = "";
        }
      }

      showApiErrorToast(response.status, message);
      return {
        error: `HTTP ${response.status}: ${message}`,
        status: response.status,
      };
    }

    const text = await response.text();
    if (!text) {
      return {};
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  } catch (err: unknown) {
    console.error("API call failed:", err);
    if (typeof window !== "undefined") {
      toast.error("Something went wrong");
    }
    return {
      error: err instanceof Error ? err.message : "Unknown API error",
    };
  }
}

export async function InstallApi(
  url: string,
  body: Record<string, unknown>,
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE" = "POST",
) {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    console.error("InstallApi: NEXT_PUBLIC_API_URL is not set");
    return { error: "API URL is not configured", status_code: 0 };
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/${url}`, {
      headers: {
        "Content-Type": "application/json",
      },
      method,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        error: `HTTP ${response.status}: ${text}`,
        status_code: response.status,
      };
    }

    return await response.json();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown network error";
    console.error("InstallApi failed:", err);
    return {
      error: message,
      status_code: 0,
    };
  }
}
