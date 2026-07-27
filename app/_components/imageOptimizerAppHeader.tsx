"use client";

import type { ReactNode } from "react";
import ChannelSelect from "@/app/_components/channelList";
import UpgradeButton from "@/app/_components/upgradeButton";

export type ImageOptimizerAppHeaderProps = {
  title: string;
  subtitle?: string;
  /** Monthly quota used count */
  quotaUsed?: number | null;
  /** Monthly quota limit; null = unlimited when used is set */
  quotaLimit?: number | null;
  /** Extra actions next to Channel / Upgrade (e.g. Save) */
  actions?: ReactNode;
  className?: string;
};

function formatQuotaBadge(used: number, limit: number | null | undefined) {
  if (limit == null || !Number.isFinite(limit) || limit <= 0) {
    return `Quota Used: ${used.toLocaleString("en-US")} / ∞`;
  }
  return `Quota Used: ${used.toLocaleString("en-US")} / ${limit.toLocaleString("en-US")}`;
}

/**
 * Per-page app header (SEOKart BigCommerce style).
 * Pass a different title/subtitle on each page.
 */
export default function ImageOptimizerAppHeader({
  title,
  subtitle,
  quotaUsed,
  quotaLimit,
  actions,
  className = "",
}: ImageOptimizerAppHeaderProps) {
  const showQuota = typeof quotaUsed === "number" && Number.isFinite(quotaUsed);

  return (
    <div
      className={`py-4 flex justify-between items-start lg:items-center gap-3 flex-col lg:flex-row ${className}`.trim()}
    >
      <div className="content-frameHead-left flex flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="Text--headingLg mb-0">{title}</h1>
          {showQuota ? (
            <span className="inline-flex items-center rounded-full bg-[#E3FBE7] px-2.5 py-1 text-[11px] font-semibold leading-none text-[#0B7A2B]">
              {formatQuotaBadge(quotaUsed, quotaLimit)}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="text-xs text-[#616161] mt-0.5 font-normal mb-0">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="content-frameHead-right flex items-center gap-3 w-full lg:w-auto flex-wrap">
        {actions}
        <ChannelSelect />
        <UpgradeButton />
      </div>
    </div>
  );
}
