export type StoredChannel = {
  channel_id: number;
  site_id?: number;
  platform?: string;
  name?: string;
  url?: string;
  /** Backward compatibility with legacy channel objects */
  domain?: string;
};

export type ApiChannel = {
  id: number;
  name: string;
  type?: string;
  platform?: string;
  status?: string;
  site_id?: number;
  url?: string;
};

export function toStoredChannel(channel: ApiChannel): StoredChannel {
  return {
    channel_id: channel.id,
    site_id: channel.site_id,
    platform: channel.platform,
    name: channel.name,
    url: channel.url,
    domain: channel.url,
  };
}

export function readStoredChannel(): StoredChannel | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem("channel");
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      channel_id?: number | string;
      site_id?: number;
      platform?: string;
      name?: string;
      url?: string;
      domain?: string;
    };
    const id = parsed.channel_id;
    const channelId =
      typeof id === "number"
        ? id
        : typeof id === "string" && id.trim() !== ""
          ? Number(id)
          : NaN;

    if (!Number.isFinite(channelId)) {
      return null;
    }

    return {
      ...parsed,
      channel_id: channelId,
      url: parsed.url ?? parsed.domain,
      domain: parsed.domain ?? parsed.url,
    };
  } catch {
    return null;
  }
}

export function readChannelId(): number {
  return readStoredChannel()?.channel_id ?? 1;
}

export const CHANNEL_CHANGED_EVENT = "channel-changed";

export function dispatchChannelChanged(channel: StoredChannel): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<StoredChannel>(CHANNEL_CHANGED_EVENT, { detail: channel }),
  );
}

export function writeStoredChannel(channel: StoredChannel): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "channel",
    JSON.stringify({
      ...channel,
      url: channel.url ?? channel.domain,
      domain: channel.domain ?? channel.url,
    }),
  );
}
