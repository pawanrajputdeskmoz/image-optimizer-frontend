"use client";

import { useEffect } from "react";
import LogRocket from "logrocket";

const APP_ID = "image-optimizer/image-optimizer";

/**
 * Boots LogRocket once for the entire app (root layout).
 */
export default function LogRocketBoot() {
  useEffect(() => {
    LogRocket.init(APP_ID);
  }, []);

  return null;
}
