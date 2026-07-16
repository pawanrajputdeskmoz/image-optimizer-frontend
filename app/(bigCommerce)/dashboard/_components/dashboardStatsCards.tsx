"use client";

import { CHANNEL_CHANGED_EVENT } from "@/app/_lib/channelStorage";
import { fetchDashboardStats } from "../_lib/imageOptimizerApi";
import { isApiFailure } from "../_lib/apiUtils";
import type { ClientDashboardStatsData } from "../types";
import type { LucideIcon } from "lucide-react";
import { Hourglass, ImageIcon, Package, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const ACTIVE_JOB_POLL_MS = 10000;

type CardAccent = "orange" | "green" | "blue" | "purple";

const ACCENTS: Record<
  CardAccent,
  { iconBg: string; icon: string; subtitle: string }
> = {
  orange: {
    iconBg: "bg-orange-50",
    icon: "text-orange-500",
    subtitle: "text-orange-500",
  },
  green: {
    iconBg: "bg-emerald-50",
    icon: "text-emerald-500",
    subtitle: "text-emerald-500",
  },
  blue: {
    iconBg: "bg-indigo-50",
    icon: "text-indigo-500",
    subtitle: "text-indigo-500",
  },
  purple: {
    iconBg: "bg-fuchsia-50",
    icon: "text-fuchsia-500",
    subtitle: "text-fuchsia-500",
  },
};

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  accent: CardAccent;
}) {
  const styles = ACCENTS[accent];
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
          {value}
        </p>
        <p className={`mt-1 text-xs font-medium ${styles.subtitle}`}>{subtitle}</p>
      </div>
      <div className={`shrink-0 rounded-xl p-3 ${styles.iconBg}`}>
        <Icon className={`h-6 w-6 ${styles.icon}`} strokeWidth={2} />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-7 w-20 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}

export default function DashboardStatsCards({
  refreshNonce = 0,
}: {
  refreshNonce?: number;
}) {
  const [stats, setStats] = useState<ClientDashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await fetchDashboardStats();
    if (!isApiFailure(res) && res.data) {
      setStats(res.data);
      setActiveJob(res.data.active_job === true);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    // Initial data fetch on mount; state updates happen after the awaited response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load, refreshNonce]);

  useEffect(() => {
    const onChannelChanged = () => void load();
    window.addEventListener(CHANNEL_CHANGED_EVENT, onChannelChanged);
    return () => window.removeEventListener(CHANNEL_CHANGED_EVENT, onChannelChanged);
  }, [load]);

  useEffect(() => {
    if (!activeJob) return undefined;

    const interval = window.setInterval(() => {
      void load(true);
    }, ACTIVE_JOB_POLL_MS);

    return () => window.clearInterval(interval);
  }, [activeJob, load]);

  if (loading) {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const pendingRestore = stats.pending_restore_images;
  const showRestorePending =
    stats.pending_mode === "restore" ||
    (pendingRestore?.value ?? 0) > 0;
  const pendingCard = showRestorePending && pendingRestore
    ? pendingRestore
    : stats.pending_images;

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={showRestorePending ? "Pending Restore" : "Pending Images"}
        value={pendingCard.display}
        subtitle={pendingCard.subtitle}
        icon={Hourglass}
        accent="orange"
      />
      <StatCard
        label="Optimized Images"
        value={stats.optimized_images.display}
        subtitle={stats.optimized_images.subtitle}
        icon={ImageIcon}
        accent="green"
      />
      <StatCard
        label="Total Data Saved"
        value={stats.total_data_saved.display}
        subtitle={stats.total_data_saved.subtitle}
        icon={Save}
        accent="blue"
      />
      <StatCard
        label="Image Quota"
        value={stats.image_quota.display}
        subtitle={stats.image_quota.subtitle}
        icon={Package}
        accent="purple"
      />
    </div>
  );
}
