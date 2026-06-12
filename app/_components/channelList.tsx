"use client";

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
import { ExternalLink } from "lucide-react";
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

function ChannelSelect() {
  const pathname = usePathname();
  const hasFetchedRef = useRef(false);
  const [channels, setChannels] = useState<ApiChannel[]>([]);
  const [channelId, setChannelId] = useState<number>(() => readChannelId());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

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

  if (isLoading) {
    return (
      <div className="relative z-20 min-w-[220px] rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
        Loading channels…
      </div>
    );
  }

  if (!channels.length) {
    return (
      <div className="relative z-20 flex min-w-[240px] flex-col gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
        <span>{loadError ?? "No channels available"}</span>
      </div>
    );
  }

  return (
    <div className="relative z-20 flex min-w-[240px] flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="channel-select" className="text-xs font-medium text-gray-600">
          Channel
        </label>
        {selectedChannel?.url ? (
          <a
            href={selectedChannel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
            title="Open channel storefront"
          >
            <ExternalLink className="size-3.5" />
            Open
          </a>
        ) : null}
      </div>

      <select
        id="channel-select"
        aria-label="Select channel"
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
        value={String(channelId)}
        onChange={handleChange}
        title={selectedChannel?.name}
      >
        {channels.map((item) => (
          <option key={item.id} value={String(item.id)}>
            {item.name}
          </option>
        ))}
      </select>

      {loadError ? (
        <p className="text-xs text-amber-700" role="status">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}

export default memo(ChannelSelect);
