import { formatBytes } from "./format";
import type { DashboardStatsData } from "./types";

type ChartSegment = {
  name: string;
  value: number;
  color?: string;
  percent?: number;
};

function formatTrendDateLabel(label: string): string {
  const d = new Date(`${label}T00:00:00`);
  if (Number.isNaN(d.getTime())) return label;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function segmentPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

export function mapStorageSavedTrendData(
  stats: DashboardStatsData | null | undefined,
) {
  const trend = stats?.charts.storage_saved_trend;
  if (!trend?.labels?.length) {
    return { data: [], subtitle: undefined as string | undefined };
  }

  const data = trend.points?.length
    ? trend.points.map((p) => ({
        name: formatTrendDateLabel(p.date),
        value: p.bytes,
        rawLabel: p.date,
      }))
    : trend.labels.map((label, i) => ({
        name: formatTrendDateLabel(label),
        value: trend.values[i] ?? 0,
        rawLabel: label,
      }));

  const subtitle =
    trend.summary_label ??
    (trend.total_in_window_display
      ? `${trend.total_in_window_display} saved in period`
      : undefined);

  return { data, subtitle, unit: trend.unit ?? "bytes" };
}

export function mapImageChartData(stats: DashboardStatsData | null | undefined) {
  const imageOpt = stats?.charts.image_optimization;
  return {
    imageOpt,
    data:
      imageOpt?.segments.map((s) => ({
        name: s.label,
        value: s.value,
        color: s.color,
        percent: s.percent,
      })) ?? [],
    subtitle: imageOpt?.summary_label,
  };
}

export function mapOptimizationByTypeData(
  stats: DashboardStatsData | null | undefined,
) {
  const byType = stats?.charts.optimization_by_type;
  const total = byType?.total ?? 0;

  const data: ChartSegment[] =
    byType?.segments.map((s) => ({
      name: s.label,
      value: s.value,
      color: s.color,
      percent: s.percent ?? segmentPercent(s.value, total),
    })) ?? [];

  return {
    data,
    subtitle: byType?.summary_label,
    total,
  };
}

export { formatBytes };
