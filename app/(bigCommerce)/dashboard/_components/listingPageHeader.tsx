"use client";

import Link from "next/link";
import { listingTheme } from "../_lib/listingTheme";

type ListingPageHeaderProps = {
  optimizeAllPending: boolean;
  restoreAllPending: boolean;
  onOptimizeAll: () => void;
  onRestoreAll: () => void;
  optimizeAllDisabled?: boolean;
};

export default function ListingPageHeader({
  optimizeAllPending,
  restoreAllPending,
  onOptimizeAll,
  onRestoreAll,
  optimizeAllDisabled,
}: ListingPageHeaderProps) {
  return (
    <div className={`${listingTheme.card} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`text-lg font-semibold ${listingTheme.textPrimary}`}>
            Product Image Optimization
          </h1>
          <p className={`text-sm ${listingTheme.textSecondary}`}>
            Optimize images and alt text based on your settings. Restore anytime
            within 30 days.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOptimizeAll}
            disabled={optimizeAllPending || optimizeAllDisabled}
            className={listingTheme.btnOutline}
          >
            {optimizeAllPending ? "Optimizing all…" : "Optimized All"}
          </button>
          <button
            type="button"
            onClick={onRestoreAll}
            disabled={restoreAllPending}
            className={listingTheme.btnOutline}
          >
            {restoreAllPending ? "Restoring all…" : "Restore All"}
          </button>
          <Link href="/setting" className={listingTheme.btnOutline}>
            Optimization Setting
          </Link>
        </div>
      </div>
    </div>
  );
}
