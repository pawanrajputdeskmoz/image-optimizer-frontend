import { ApiCall } from "@/app/_api/apiCall";
import type { ApiChannel } from "./channelStorage";

const CHANNELS_SESSION_KEY = "channels-list-cache";

export type ChannelsLoadResult = {
  channels: ApiChannel[];
  defaultChannelId?: number;
};

let inflightRequest: Promise<ChannelsLoadResult> | null = null;

type ChannelsApiResponse = {
  data?: ApiChannel[];
  default?: { channel_id?: number };
  error?: string;
};

function readSessionCache(): ChannelsLoadResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(CHANNELS_SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ChannelsLoadResult;
    if (!Array.isArray(parsed.channels) || parsed.channels.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(result: ChannelsLoadResult): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(CHANNELS_SESSION_KEY, JSON.stringify(result));
}

async function requestChannels(): Promise<ChannelsLoadResult> {
  const raw = (await ApiCall("settings/channels", {}, { method: "GET" })) as
    | ChannelsApiResponse
    | { error?: string };

  if (raw && typeof raw === "object" && "error" in raw) {
    throw new Error(raw.error || "Failed to load channels");
  }

  const response = raw as ChannelsApiResponse;
  const channels = Array.isArray(response.data) ? response.data : [];

  if (!channels.length) {
    throw new Error("No channels available");
  }

  const result: ChannelsLoadResult = {
    channels,
    defaultChannelId: response.default?.channel_id,
  };

  writeSessionCache(result);
  return result;
}

/** Fetches channels once per session (cached in memory + sessionStorage). */
export function fetchChannelsOnce(): Promise<ChannelsLoadResult> {
  const cached = readSessionCache();
  if (cached) {
    return Promise.resolve(cached);
  }

  if (!inflightRequest) {
    inflightRequest = requestChannels().finally(() => {
      inflightRequest = null;
    });
  }

  return inflightRequest;
}

export function clearChannelsCache(): void {
  inflightRequest = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(CHANNELS_SESSION_KEY);
  }
}
