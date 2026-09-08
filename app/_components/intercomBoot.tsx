"use client";

import { useEffect } from "react";
import Script from "next/script";

const APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID?.trim() || "";
const BOOT_POLL_MS = 500;

declare global {
  interface Window {
    Intercom?: ((...args: unknown[]) => void) & {
      q?: unknown[];
      c?: (args: IArguments) => void;
    };
    intercomSettings?: Record<string, unknown>;
  }
}

/**
 * Boots Intercom with localStorage user_id (DB id) + user_hash (HMAC).
 */
export default function IntercomBoot() {
  useEffect(() => {
    if (!APP_ID) return;

    const interval = window.setInterval(() => {
      const userId = localStorage.getItem("user_id")?.trim() || "";
      const userHash = localStorage.getItem("user_hash")?.trim() || "";

      if (!userId || !userHash) return;
      if (typeof window.Intercom !== "function") return;

      try {
        window.Intercom("shutdown");
      } catch {
        // Messenger may not be booted yet
      }

      const settings = {
        app_id: APP_ID,
        user_id: userId,
        user_hash: userHash,
      };

      window.intercomSettings = settings;
      window.Intercom("boot", settings);
      window.clearInterval(interval);
    }, BOOT_POLL_MS);

    return () => window.clearInterval(interval);
  }, []);

  if (!APP_ID) return null;

  // Load widget immediately — do not wait for window "load"
  // (Next.js afterInteractive often runs after load already fired).
  return (
    <Script id="intercom-widget" strategy="afterInteractive">{`
      (function () {
        var w = window;
        var d = document;
        var appId = ${JSON.stringify(APP_ID)};
        if (typeof w.Intercom === "function") return;
        var i = function () { i.c(arguments); };
        i.q = [];
        i.c = function (args) { i.q.push(args); };
        w.Intercom = i;
        var s = d.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        s.src = "https://widget.intercom.io/widget/" + appId;
        var x = d.getElementsByTagName("script")[0];
        if (x && x.parentNode) x.parentNode.insertBefore(s, x);
        else d.head.appendChild(s);
      })();
    `}</Script>
  );
}
