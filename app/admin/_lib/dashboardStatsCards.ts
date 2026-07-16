import type { DashboardStatsData } from "./types";

export type StatsCardItem = {
  key: string;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
};

export function mapDashboardStatsCards(
  stats: DashboardStatsData | null | undefined,
): StatsCardItem[] {
  const cards = stats?.cards;
  if (!cards) return [];

  const workers = cards.workers;
  const summaryLabel = workers?.summary_label;

  return [
    {
      key: "total_clients",
      label: "Total clients",
      value: cards.total_clients?.toLocaleString() ?? "—",
    },
    {
      key: "active_stores",
      label: "Active stores",
      value: cards.active_stores?.toLocaleString() ?? "—",
    },
    {
      key: "total_workers",
      label: "Total workers",
      value: cards.total_workers ?? workers?.total_workers ?? 0,
      hint: summaryLabel,
    },
    {
      key: "running",
      label: "Running",
      value: cards.running ?? workers?.running ?? 0,
      tone: "success",
    },
    {
      key: "stopped",
      label: "Stopped",
      value: cards.stopped ?? workers?.stopped ?? 0,
      tone: (cards.stopped ?? workers?.stopped ?? 0) > 0 ? "warning" : "default",
    },
    {
      key: "warn",
      label: "Warning",
      value: cards.warn ?? workers?.warn ?? 0,
      tone: (cards.warn ?? workers?.warn ?? 0) > 0 ? "warning" : "default",
    },
    {
      key: "at_risk",
      label: "At risk",
      value: cards.at_risk ?? workers?.at_risk ?? 0,
      tone: (cards.at_risk ?? workers?.at_risk ?? 0) > 0 ? "danger" : "default",
    },
    {
      key: "pending_jobs",
      label: "Pending jobs",
      value: cards.pending_jobs ?? workers?.pending_jobs ?? 0,
      tone: "warning",
    },
    {
      key: "failed_jobs",
      label: "Failed jobs",
      value: cards.failed_jobs ?? workers?.failed_jobs ?? 0,
      tone: "danger",
    },
    {
      key: "optimized_images",
      label: "Optimized images",
      value: (cards.optimized_images ?? 0).toLocaleString(),
    },
    {
      key: "total_saved",
      label: "Total saved",
      value: cards.total_saved?.value ?? "—",
      hint: cards.total_saved
        ? `Avg ${cards.total_saved.average_saving_percent}%`
        : undefined,
    },
    {
      key: "redis",
      label: "Redis",
      value: cards.redis?.label ?? "—",
    },
    {
      key: "database",
      label: "Database",
      value: cards.database?.label ?? "—",
    },
  ];
}
