"use client";

import { useEffect } from "react";
import LogRocket from "logrocket";

// LogRocket project ID for this app
const APP_ID = "image-optimizer/image-optimizer";

// IPs that should not be recorded (e.g. office / team machines)
const BLOCKED_IPS: string[] = [
  // Add IPs here, e.g. "203.0.113.10",
];

const IDENTIFY_POLL_MS = 500;

/**
 * Starts LogRocket session recording for the whole app.
 * Skips blocked IPs so internal traffic is not tracked.
 */
export default function LogRocketBoot() {
  useEffect(() => {
    // Stops work if the component unmounts before IP check finishes
    let cancelled = false;
    let identifyInterval: number | undefined;

    async function startLogRocket() {
      try {
        // Get the visitor's public IP
        const res = await fetch("https://api.ipify.org?format=json");
        const data = (await res.json()) as { ip?: string };
        const ip = data?.ip;

        // Don't start if unmounted, IP missing, or IP is blocked
        if (cancelled || !ip || BLOCKED_IPS.includes(ip)) {
          return;
        }

        // Start session recording
        LogRocket.init(APP_ID);

        // Wait until load/install saves shop (+ email) in localStorage
        identifyInterval = window.setInterval(() => {
          if (cancelled) return;

          const shop = localStorage.getItem("shop")?.trim() || "";
          if (!shop) return;

          const email = localStorage.getItem("email")?.trim() || "";

          LogRocket.identify(shop, {
            ...(email ? { email } : {}),
            platform: "bigcommerce",
          });
          window.clearInterval(identifyInterval);
        }, IDENTIFY_POLL_MS);
      } catch {
        // If we can't check the IP, skip LogRocket to avoid tracking blocked users
      }
    }

    void startLogRocket();

    return () => {
      cancelled = true;
      if (identifyInterval !== undefined) {
        window.clearInterval(identifyInterval);
      }
    };
  }, []);

  // This component only boots LogRocket — nothing to render
  return null;
}
