"use client";

import { useEffect, useState } from "react";

export default function ChannelList() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem("channel");
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          channel_name?: string;
          domain?: string;
        };
        setLabel(parsed.channel_name ?? parsed.domain ?? "");
      } catch {
        setLabel("");
      }
    });
  }, []);

  if (!label) return null;

  return (
    <span className="ms-2 rounded bg-secondary-subtle px-2 py-1 text-secondary small">
      {label}
    </span>
  );
}
