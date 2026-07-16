"use client";

import {
  DashboardMetricCard,
  type DashboardMetricAccent,
  HealthStatusBanner,
  LoadingBlock,
  PageHeader,
  RefreshBtn,
  ServerHealthPanel,
  SimpleLineChart,
  SimplePieChart,
  StatCard,
  StatusBadge,
  WorkerQueuesTable,
} from "@/app/admin/_components/adminUi";
import { formatBytes } from "@/app/admin/_lib/format";
import { adminApi } from "@/app/admin/_lib/adminApi";
import {
  mapImageChartData,
  mapOptimizationByTypeData,
  mapStorageSavedTrendData,
} from "@/app/admin/_lib/dashboardCharts";
import { mapDashboardStatsCards } from "@/app/admin/_lib/dashboardStatsCards";
import type {
  AdminHealthData,
  DashboardCardsData,
  DashboardStatsData,
  RecentErrorsData,
} from "@/app/admin/_lib/types";
import type { LucideIcon } from "lucide-react";
import { Database, ImageIcon, Store, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const CARD_ICONS: Record<string, LucideIcon> = {
  total_clients: Users,
  active_stores: Store,
  total_optimized_images: ImageIcon,
  storage_saved: Database,
};

type DashboardState = {
  cards: DashboardCardsData | null;
  stats: DashboardStatsData | null;
  health: AdminHealthData | null;
  errors: RecentErrorsData | null;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardState>({
    cards: null,
    stats: null,
    health: null,
    errors: null,
  });

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const [cardsRes, statsRes, healthRes, errorsRes] = await Promise.all([
      adminApi.dashboardCards(),
      adminApi.dashboardStats(),
      adminApi.serverHealth(),
      adminApi.recentErrors(10),
    ]);

    setData({
      cards: cardsRes.data ?? null,
      stats: statsRes.data ?? null,
      health: healthRes.data ?? null,
      errors: errorsRes.data ?? null,
    });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // Initial data fetch on mount; state updates happen after the awaited response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (loading) return <LoadingBlock label="Loading dashboard…" />;

  const stats = data.stats;
  const health = data.health;
  const errors = data.errors?.recent_errors ?? [];

  const storageTrend = mapStorageSavedTrendData(stats);
  const imageChart = mapImageChartData(stats);
  const optimizationByType = mapOptimizationByTypeData(stats);
  const statsCards = mapDashboardStatsCards(stats);
  const workerQueues = stats?.cards.workers?.queues ?? [];

  const alerts = health?.recent_alerts ?? [];

  const heroCards =
    data.cards?.cards.map((card) => ({
      key: card.key,
      label: card.label,
      value: card.value_formatted,
      icon: CARD_ICONS[card.key] ?? Users,
      accent: card.color as DashboardMetricAccent,
      trendPercent: card.trend?.percent,
      trendDirection: card.trend?.direction,
      trendLabel: card.trend?.label,
      sparkline: card.sparkline,
    })) ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Worker, queue, and optimization overview"
        action={<RefreshBtn onClick={() => void load(true)} loading={refreshing} />}
      />

      {health && health.healthy === false ? (
        <div className="mb-4">
          <HealthStatusBanner health={health} />
        </div>
      ) : null}

      {heroCards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {heroCards.map((card) => (
            <DashboardMetricCard
              key={card.key}
              label={card.label}
              value={card.value}
              icon={card.icon}
              accent={card.accent}
              trendPercent={card.trendPercent}
              trendDirection={card.trendDirection}
              trendLabel={card.trendLabel}
              sparkline={card.sparkline}
            />
          ))}
        </div>
      ) : null}

      {statsCards.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {statsCards.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={
                card.key === "redis" || card.key === "database" ? (
                  <StatusBadge status={String(card.value)} />
                ) : (
                  card.value
                )
              }
              hint={card.hint}
              tone={card.tone}
            />
          ))}
        </div>
      ) : null}

      {workerQueues.length ? <WorkerQueuesTable queues={workerQueues} /> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SimpleLineChart
          title="Storage saved trend"
          subtitle={storageTrend.subtitle ?? stats?.charts.storage_saved_trend?.summary_label}
          data={storageTrend.data}
          valueFormatter={(v) => formatBytes(v)}
        />
        <SimplePieChart
          title="Image optimization"
          subtitle={imageChart.subtitle}
          data={imageChart.data}
        />
        <SimplePieChart
          title="Optimization by type"
          subtitle={optimizationByType.subtitle}
          data={optimizationByType.data}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {health ? (
          <div>
            <ServerHealthPanel health={health} compact />
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">Recent alerts</p>
            <Link
              href="/admin/monitoring/alerts"
              className="text-xs text-slate-500 hover:underline"
            >
              View all
            </Link>
          </div>
          {alerts.length ? (
            <ul className="space-y-2">
              {alerts.map((a, i) => (
                <li
                  key={`${a.source ?? "alert"}-${i}`}
                  className="flex items-start justify-between gap-2 text-xs"
                >
                  <span className="text-slate-700">
                    {a.message}
                    {a.source ? (
                      <span className="ml-1 text-slate-400">({a.source})</span>
                    ) : null}
                  </span>
                  <StatusBadge status={a.severity} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No recent alerts</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">Recent error logs</p>
          <Link
            href="/admin/monitoring/logs?level=error"
            className="text-xs text-slate-500 hover:underline"
          >
            View all
          </Link>
        </div>
        {errors.length ? (
          <ul className="divide-y divide-slate-100">
            {errors.map((log, i) => (
              <li
                key={`${log.created_at ?? i}-${log.job_uuid ?? i}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs"
              >
                <span className="text-slate-700">{log.message}</span>
                <span className="text-slate-400">
                  {log.time_ago ?? log.created_at}
                  {log.store_hash ? ` · ${log.store_hash}` : ""}
                  {log.category ? ` · ${log.category}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">No recent errors</p>
        )}
      </div>
    </div>
  );
}
