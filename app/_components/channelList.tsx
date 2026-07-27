"use client";

import Image from "next/image";
import { fetchChannelsOnce } from "@/app/_lib/channelsCache";
import {
  dispatchChannelChanged,
  readChannelId,
  readStoredChannel,
  toStoredChannel,
  writeStoredChannel,
  type ApiChannel,
  type StoredChannel,
} from "@/app/_lib/channelStorage";
import { usePathname } from "next/navigation";
import { memo, useEffect, useRef, useState, type ChangeEvent } from "react";

function storedChannelToApiChannel(stored: StoredChannel): ApiChannel {
  return {
    id: stored.channel_id,
    name: stored.name ?? `Channel ${stored.channel_id}`,
    site_id: stored.site_id,
    platform: stored.platform,
    url: stored.url ?? stored.domain,
  };
}

function resolveInitialChannel(
  channels: ApiChannel[],
  defaultChannelId?: number,
): StoredChannel | null {
  const stored = readStoredChannel();
  if (stored) {
    const match = channels.find((item) => item.id === stored.channel_id);
    if (match) {
      return toStoredChannel(match);
    }
  }

  if (defaultChannelId != null) {
    const match = channels.find((item) => item.id === defaultChannelId);
    if (match) {
      return toStoredChannel(match);
    }
  }

  return channels[0] ? toStoredChannel(channels[0]) : null;
}

function channelDisplayName(channel?: ApiChannel | null) {
  if (!channel) return "";
  const raw = channel.url || channel.name || "";
  return raw.replace(/^https?:\/\//, "");
}

function ChannelSelect() {
  const pathname = usePathname();
  const hasFetchedRef = useRef(false);
  const [channels, setChannels] = useState<ApiChannel[]>([]);
  const [channelId, setChannelId] = useState<number>(() => readChannelId());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/install") {
      return;
    }

    const hasToken =
      typeof window !== "undefined" &&
      Boolean(
        localStorage.getItem("api-token")?.trim() ||
          localStorage.getItem("access_token")?.trim() ||
          localStorage.getItem("token")?.trim(),
      );

    if (!hasToken) {
      setIsLoading(false);
      return;
    }

    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    let isActive = true;

    void (async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const { channels: list, defaultChannelId } = await fetchChannelsOnce();
        if (!isActive) {
          return;
        }

        setChannels(list);

        const initial = resolveInitialChannel(list, defaultChannelId);
        if (initial) {
          const stored = readStoredChannel();
          if (!stored || stored.channel_id !== initial.channel_id) {
            writeStoredChannel(initial);
          }
          setChannelId(initial.channel_id);
        }
      } catch (err) {
        if (!isActive) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "Failed to load channels";
        setLoadError(message);

        const stored = readStoredChannel();
        if (stored) {
          setChannels([storedChannelToApiChannel(stored)]);
          setChannelId(stored.channel_id);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [pathname]);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextId = Number(event.target.value);
    if (nextId === channelId) {
      return;
    }

    const selected = channels.find((item) => item.id === nextId);
    if (!selected) {
      return;
    }

    const stored = toStoredChannel(selected);
    writeStoredChannel(stored);
    setChannelId(stored.channel_id);
    dispatchChannelChanged(stored);
  };

  if (pathname === "/install") {
    return null;
  }

  const selectedChannel = channels.find((item) => item.id === channelId);
  const displayText = channelDisplayName(selectedChannel);
  const storefrontUrl = selectedChannel?.url;

  if (isLoading) {
    return (
      <div className="custom-dropi link-iconDropi headChannel-dropi flex-1 lg:flex-none lg:w-[240px]">
        <span className="dropiLabel">Channel</span>
        <div className="relative w-full overflow-hidden">
          <select
            className="form-select"
            disabled
            aria-label="Loading channels"
          >
            <option>Loading…</option>
          </select>
        </div>
      </div>
    );
  }

  if (!channels.length) {
    return (
      <div className="custom-dropi link-iconDropi headChannel-dropi flex-1 lg:flex-none lg:w-[240px]">
        <span className="dropiLabel">Channel</span>
        <div className="relative w-full overflow-hidden">
          <select className="form-select" disabled aria-label="No channels">
            <option>{loadError ?? "No channels available"}</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-dropi link-iconDropi headChannel-dropi flex-1 lg:flex-none lg:w-[240px]">
      <span className="dropiLabel">
        Channel
        {storefrontUrl ? (
          <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
            <Image
              src="/images/link-icon.svg"
              alt=""
              width={20}
              height={20}
            />
          </a>
        ) : null}
      </span>
      <div className="relative w-full overflow-hidden">
        <select
          className="form-select"
          aria-label="Select channel"
          onChange={handleChange}
          value={String(channelId)}
          title={displayText}
        >
          {channels.map((item) => (
            <option key={item.id} value={String(item.id)}>
              {channelDisplayName(item) || item.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default memo(ChannelSelect);
