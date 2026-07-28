"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { CHANNEL_CHANGED_EVENT } from "@/app/_lib/channelStorage";
import { fetchDashboardStats } from "../_lib/imageOptimizerApi";
import { isApiFailure } from "../_lib/apiUtils";
import type { ClientDashboardStatsData } from "../types";
import { useCallback, useEffect, useState } from "react";

const ACTIVE_JOB_POLL_MS = 10000;

type CardAccent = "orange" | "green" | "blue" | "purple";

const ACCENTS: Record<
  CardAccent,
  { iconBg: string; subtitleColor: string; iconSrc: string; iconAlt: string }
> = {
  orange: {
    iconBg: "bg-[#FFF7ED]",
    subtitleColor: "#D97706",
    iconSrc: "/images/pending-image-icon.svg",
    iconAlt: "Pending images",
  },
  green: {
    iconBg: "bg-[#ECFDF5]",
    subtitleColor: "#059669",
    iconSrc: "/images/optimized-image-icon.svg",
    iconAlt: "Optimized images",
  },
  blue: {
    iconBg: "bg-[#EEF2FF]",
    subtitleColor: "#4F46E5",
    iconSrc: "/images/total-data-saved-icon.svg",
    iconAlt: "Total data saved",
  },
  purple: {
    iconBg: "bg-[#FAF5FF]",
    subtitleColor: "#A046E5",
    iconSrc: "/images/image-quota-icon.svg",
    iconAlt: "Image quota",
  },
};

function StatCard({
  label,
  value,
  subtitle,
  accent,
  valueLoading = false,
}: {
  label: string;
  value: string;
  subtitle: string;
  accent: CardAccent;
  valueLoading?: boolean;
}) {
  const styles = ACCENTS[accent];

  return (
    <div className="card mb-0!">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className="mb-0 font-normal leading-tight"
            style={{ fontSize: 13, color: "#616161" }}
          >
            {label}
          </p>
          <p
            className="mb-0 mt-1 flex min-h-7 items-center font-bold tabular-nums leading-tight tracking-tight"
            style={{ fontSize: 24, color: "#303030" }}
          >
            {valueLoading ? (
              <Loader2
                className="size-5 animate-spin text-[#616161]"
                aria-label="Loading"
              />
            ) : (
              value
            )}
          </p>
          <p
            className="mb-0 mt-1 font-medium leading-tight"
            style={{ fontSize: 12, color: styles.subtitleColor }}
          >
            {subtitle}
          </p>
        </div>
        <div
          className={`flex size-14 shrink-0 items-center justify-center rounded-3xl ${styles.iconBg}`}
        >
          <Image
            src={styles.iconSrc}
            alt={styles.iconAlt}
            width={24}
            height={24}
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="card mb-0!">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-7 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="size-14 shrink-0 animate-pulse rounded-3xl bg-gray-100" />
      </div>
    </div>
  );
}

export default function DashboardStatsCards({
  refreshNonce = 0,
  onStatsChange,
}: {
  refreshNonce?: number;
  onStatsChange?: (stats: ClientDashboardStatsData | null) => void;
}) {
  const [stats, setStats] = useState<ClientDashboardStatsData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeJob, setActiveJob] = useState(false);

  const load = useCallback(async (mode: "initial" | "refresh" | "silent" = "initial") => {
    if (mode === "initial") setInitialLoading(true);
    if (mode === "refresh") setRefreshing(true);

    const res = await fetchDashboardStats();
    if (!isApiFailure(res) && res.data) {
      setStats(res.data);
      setActiveJob(res.data.active_job === true);
      onStatsChange?.(res.data);
    } else if (mode === "initial") {
      onStatsChange?.(null);
    }

    if (mode === "initial") setInitialLoading(false);
    if (mode === "refresh") setRefreshing(false);
  }, [onStatsChange]);

  useEffect(() => {
    // Initial load / refreshNonce bump: keep cards visible, spinner only on counts after first load.
     
    void load(stats ? "refresh" : "initial");
    // Intentionally only re-run on refreshNonce / load identity — not on stats.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, refreshNonce]);

  useEffect(() => {
    const onChannelChanged = () => void load(stats ? "refresh" : "initial");
    window.addEventListener(CHANNEL_CHANGED_EVENT, onChannelChanged);
    return () => window.removeEventListener(CHANNEL_CHANGED_EVENT, onChannelChanged);
  }, [load, stats]);

  useEffect(() => {
    if (!activeJob) return undefined;

    const interval = window.setInterval(() => {
      void load("silent");
    }, ACTIVE_JOB_POLL_MS);

    return () => window.clearInterval(interval);
  }, [activeJob, load]);

  if (initialLoading && !stats) {
    return (
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Pending Images"
        value={stats.pending_images.display}
        subtitle={stats.pending_images.subtitle}
        accent="orange"
        valueLoading={refreshing}
      />
      <StatCard
        label="Optimized Images"
        value={stats.optimized_images.display}
        subtitle={stats.optimized_images.subtitle}
        accent="green"
        valueLoading={refreshing}
      />
      <StatCard
        label="Total Data Saved"
        value={stats.total_data_saved.display}
        subtitle={stats.total_data_saved.subtitle}
        accent="blue"
        valueLoading={refreshing}
      />
      <StatCard
        label="Image Quota"
        value={stats.image_quota.display}
        subtitle={stats.image_quota.subtitle}
        accent="purple"
        valueLoading={refreshing}
      />
    </div>
  );
}
