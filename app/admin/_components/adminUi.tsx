"use client";

import type { ReactNode } from "react";
import ConfirmModal from "@/app/_components/confirmation";
import Spinner from "@/app/_components/ui/Spinner";
import Link from "next/link";
import { clearAdminToken } from "@/app/admin/_lib/adminApi";
import { formatDateTime, formatBytes } from "@/app/admin/_lib/format";
import type { AdminHealthData } from "@/app/admin/_lib/types";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  List,
  LogOut,
  Server,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const NAV = [
  { href: "/admin/monitoring", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/monitoring/clients", label: "Clients", icon: Building2 },
  { href: "/admin/monitoring/plans", label: "Plans", icon: CreditCard },
  { href: "/admin/monitoring/workers", label: "Workers", icon: Users },
  { href: "/admin/monitoring/logs", label: "Logs", icon: List },
  { href: "/admin/monitoring/failed-jobs", label: "Failed Jobs", icon: XCircle },
  { href: "/admin/monitoring/alerts", label: "Alerts", icon: AlertTriangle },
  {
    href: "/admin/monitoring/image-stats",
    label: "Image Stats",
    icon: BarChart3,
  },
  { href: "/admin/monitoring/server-health", label: "Server Health", icon: Server },
];

const STATUS_STYLES: Record<string, string> = {
  running: "bg-emerald-100 text-emerald-700",
  success: "bg-emerald-100 text-emerald-700",
  stopped: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
  paused: "bg-amber-100 text-amber-800",
  warn: "bg-amber-100 text-amber-800",
  warning: "bg-amber-100 text-amber-800",
  at_risk: "bg-red-100 text-red-800",
  not_responding: "bg-red-200 text-red-900",
  info: "bg-sky-100 text-sky-700",
  low: "bg-gray-100 text-gray-600",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
  active: "bg-red-100 text-red-700",
  resolved: "bg-emerald-100 text-emerald-700",
  muted: "bg-gray-100 text-gray-600",
  ok: "bg-emerald-100 text-emerald-700",
  healthy: "bg-emerald-100 text-emerald-700",
  connected: "bg-emerald-100 text-emerald-700",
  degraded: "bg-amber-100 text-amber-800",
  disconnected: "bg-red-100 text-red-700",
  optimized: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-800",
  skipped: "bg-gray-100 text-gray-600",
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Admin
          </p>
          <h1 className="text-sm font-semibold">Monitoring</h1>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin/monitoring"
                ? pathname === href
                : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/dashboard"
          className="m-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>
        <button
          type="button"
          onClick={() => {
            clearAdminToken();
            router.replace("/admin/monitoring/login");
          }}
          className="mx-2 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function getSystemRamTone(
  pct: number | null,
): "default" | "success" | "warning" | "danger" {
  if (pct == null) return "default";
  if (pct > 95) return "danger";
  if (pct >= 75) return "warning";
  return "success";
}

export function getSystemRamBarColor(pct: number | null): string {
  if (pct == null) return "bg-slate-200";
  if (pct > 95) return "bg-red-500";
  if (pct >= 90) return "bg-orange-500";
  if (pct >= 75) return "bg-amber-500";
  return "bg-emerald-500";
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  tooltip,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
  tooltip?: string;
}) {
  const tones = {
    default: "border-slate-200",
    success: "border-emerald-200 bg-emerald-50/40",
    warning: "border-amber-200 bg-amber-50/40",
    danger: "border-red-200 bg-red-50/40",
  };
  return (
    <div className={`rounded-xl border bg-white p-3 ${tones[tone]}`}>
      <p className="text-xs font-medium text-slate-500" title={tooltip}>
        {label}
        {tooltip ? (
          <span className="ml-1 cursor-help text-slate-400" aria-hidden>
            ⓘ
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

const METRIC_ACCENTS = {
  purple: {
    iconBg: "bg-violet-100",
    icon: "text-violet-600",
    line: "#8b5cf6",
  },
  blue: {
    iconBg: "bg-blue-100",
    icon: "text-blue-600",
    line: "#3b82f6",
  },
  green: {
    iconBg: "bg-emerald-100",
    icon: "text-emerald-600",
    line: "#10b981",
  },
  orange: {
    iconBg: "bg-orange-100",
    icon: "text-orange-600",
    line: "#f97316",
  },
} as const;

export type DashboardMetricAccent = keyof typeof METRIC_ACCENTS;

function MetricSparkline({ data, color }: { data: number[]; color: string }) {
  const points = data.map((value, i) => ({ i, value }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DashboardMetricCard({
  label,
  value,
  icon: Icon,
  accent,
  trendPercent,
  trendDirection,
  trendLabel = "vs previous 7 days",
  sparkline,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  accent: DashboardMetricAccent;
  trendPercent?: number | null;
  trendDirection?: "up" | "down";
  trendLabel?: string;
  sparkline?: number[];
}) {
  const styles = METRIC_ACCENTS[accent];
  const trendUp = trendDirection ? trendDirection === "up" : trendPercent == null || trendPercent >= 0;
  const TrendIcon = trendUp ? TrendingUp : TrendingDown;
  const trendColor = trendUp ? "text-emerald-600" : "text-red-500";
  const sparkData =
    sparkline?.length && sparkline.length >= 2 ? sparkline : undefined;
  const trendDisplay =
    trendPercent == null
      ? null
      : trendPercent >= 1000
        ? trendPercent.toLocaleString(undefined, { maximumFractionDigits: 1 })
        : trendPercent.toFixed(1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2.5 ${styles.iconBg}`}>
          <Icon className={`h-5 w-5 ${styles.icon}`} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        {trendDisplay != null ? (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="font-semibold">{trendDisplay}%</span>
            <span className="font-normal text-slate-400">{trendLabel}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">&nbsp;</span>
        )}
        {sparkData ? (
          <div className="h-10 w-28 shrink-0 opacity-90">
            <MetricSparkline data={sparkData} color={styles.line} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ServerMemoryCards({
  systemRamUsagePercent,
  systemRamUsedMb,
  systemRamTotalMb,
  apiProcessMemoryMb,
  apiProcessHeapMb,
  memoryScopeNote,
  ramUsageFallback,
}: {
  systemRamUsagePercent?: number | null;
  systemRamUsedMb?: number | null;
  systemRamTotalMb?: number | null;
  apiProcessMemoryMb?: number | null;
  apiProcessHeapMb?: number | null;
  memoryScopeNote?: string | null;
  ramUsageFallback?: number | null;
}) {
  const pct = systemRamUsagePercent ?? ramUsageFallback ?? null;
  const ramSubtitle =
    systemRamUsedMb != null && systemRamTotalMb != null
      ? `${systemRamUsedMb} / ${systemRamTotalMb} MB`
      : undefined;
  const heapSubtitle =
    apiProcessHeapMb != null ? `Heap: ${apiProcessHeapMb} MB` : undefined;

  return (
    <>
      <StatCard
        label="System RAM (host)"
        value={pct == null ? "N/A" : `${pct}%`}
        hint={ramSubtitle}
        tone={getSystemRamTone(pct)}
        tooltip={memoryScopeNote ?? undefined}
      />
      <StatCard
        label="API process"
        value={apiProcessMemoryMb == null ? "N/A" : `${apiProcessMemoryMb} MB`}
        hint={heapSubtitle}
      />
    </>
  );
}

function healthBannerStyle(healthy?: boolean, status?: string) {
  const key = (status ?? "").toLowerCase();
  if (healthy === true || key === "ok" || key === "healthy") {
    return {
      box: "border-emerald-200 bg-emerald-50",
      text: "text-emerald-900",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
    };
  }
  if (key === "degraded" || healthy === false) {
    return {
      box: "border-amber-200 bg-amber-50",
      text: "text-amber-950",
      icon: AlertTriangle,
      iconClass: "text-amber-600",
    };
  }
  return {
    box: "border-red-200 bg-red-50",
    text: "text-red-900",
    icon: AlertCircle,
    iconClass: "text-red-600",
  };
}

export function HealthStatusBanner({ health }: { health: AdminHealthData }) {
  const status = health.status ?? (health.healthy ? "ok" : "degraded");
  const style = healthBannerStyle(health.healthy, status);
  const Icon = style.icon;
  const title =
    health.healthy === true
      ? "All systems operational"
      : `Server health ${status}`;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${style.box}`}
    >
      <div className={`flex items-center gap-2.5 ${style.text}`}>
        <Icon className={`h-5 w-5 shrink-0 ${style.iconClass}`} />
        <div>
          <p className="text-sm font-semibold capitalize">{title}</p>
          {health.healthy === false ? (
            <p className="text-xs opacity-80">
              One or more services need attention — see details below.
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={status} />
        {health.checked_at ? (
          <span className="text-xs text-slate-500">
            {formatDateTime(health.checked_at)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ServiceStatusRow({
  name,
  ok,
  status,
  pingMs,
  error,
  meta,
}: {
  name: string;
  ok: boolean;
  status?: string;
  pingMs?: number | null;
  error?: string | null;
  meta?: string;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        ok ? "border-slate-200 bg-slate-50/50" : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">{name}</span>
        <StatusBadge status={ok ? (status ?? "ok") : "error"} />
      </div>
      {meta ? <p className="mt-1 text-xs text-slate-500">{meta}</p> : null}
      {pingMs != null ? (
        <p className="mt-1 text-xs text-slate-500">Ping: {pingMs} ms</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-700">{error}</p>
      ) : null}
    </div>
  );
}

export function ServerHealthPanel({
  health,
  compact = false,
}: {
  health: AdminHealthData;
  compact?: boolean;
}) {
  const sh = health.server_health;
  const borderTone =
    health.healthy === false
      ? "border-amber-300 ring-1 ring-amber-100"
      : "border-slate-200";

  return (
    <div className="space-y-3">
      {!compact ? <HealthStatusBanner health={health} /> : null}
      <div className={`rounded-xl border bg-white p-3 ${borderTone}`}>
        <p className="mb-2 text-xs font-semibold text-slate-600">Resources</p>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <ServerMemoryCards
            systemRamUsagePercent={sh.ram.percentage}
            systemRamUsedMb={sh.ram.used_mb}
            systemRamTotalMb={sh.ram.total_mb}
            apiProcessMemoryMb={sh.api_process.memory_mb}
            apiProcessHeapMb={sh.api_process.heap_mb}
          />
        </div>
        <div className="space-y-3">
          <UsageBar
            label="System RAM (host)"
            value={sh.ram.percentage}
            variant="systemRam"
          />
          <UsageBar label="Disk" value={sh.disk_usage_percentage} />
          <p className="text-xs text-slate-500">Uptime: {sh.uptime_label}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ServiceStatusRow
          name="MongoDB"
          ok={health.services.mongodb.ok}
          status={health.services.mongodb.status}
          pingMs={health.services.mongodb.ping_ms}
          meta={health.services.mongodb.database}
        />
        <ServiceStatusRow
          name="Redis"
          ok={health.services.redis.ok}
          status={health.services.redis.ok ? "connected" : "disconnected"}
          pingMs={health.services.redis.ping_ms}
          error={health.services.redis.error}
          meta={
            health.services.redis.host
              ? `${health.services.redis.host}:${health.services.redis.port ?? 6379}`
              : undefined
          }
        />
      </div>

      {!compact && health.process ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-slate-600">API process</p>
          <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
            <p>Node: {health.process.node_version}</p>
            <p>PID: {health.process.pid}</p>
            <p>Env: {health.process.env}</p>
            <p>CPUs: {health.process.cpu_count}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  const key = String(status ?? "unknown").toLowerCase();
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
        STATUS_STYLES[key] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status ?? "unknown"}
    </span>
  );
}

export function WorkerQueuesTable({
  queues,
}: {
  queues: Array<{
    queue: string;
    category: string;
    status: string;
    workers_count: number;
    backlog: number;
    npm_script_hint?: string;
  }>;
}) {
  if (!queues.length) return null;
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">Worker queues</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="pb-2 pr-3 font-medium">Queue</th>
              <th className="pb-2 pr-3 font-medium">Category</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 pr-3 font-medium">Workers</th>
              <th className="pb-2 font-medium">Backlog</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {queues.map((q) => (
              <tr key={q.queue} className="text-slate-700">
                <td className="py-2 pr-3 font-medium">{q.queue}</td>
                <td className="py-2 pr-3 capitalize">{q.category.replace(/_/g, " ")}</td>
                <td className="py-2 pr-3">
                  <StatusBadge status={q.status} />
                </td>
                <td className="py-2 pr-3 tabular-nums">{q.workers_count}</td>
                <td className="py-2 tabular-nums">{q.backlog}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Spinner size="sm" />
      {label}
    </div>
  );
}

export function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {message}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 font-medium underline"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function AdminTable({
  columns,
  rows,
  onRowClick,
}: {
  columns: { key: string; label: string; className?: string }[];
  rows: { id: string; cells: ReactNode[]; className?: string }[];
  onRowClick?: (id: string) => void;
}) {
  if (!rows.length) return <EmptyBlock message="No records found." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-2 font-medium ${col.className ?? ""}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.id) : undefined}
              className={`border-b border-slate-50 last:border-0 ${
                onRowClick ? "cursor-pointer hover:bg-slate-50" : ""
              } ${row.className ?? ""}`}
            >
              {row.cells.map((cell, i) => (
                <td key={columns[i]?.key ?? i} className="px-3 py-2.5 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded border border-slate-200 bg-white px-2.5 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded border border-slate-200 bg-white px-2.5 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function FilterGrid({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export const filterInputClass =
  "w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-slate-400";

export function DetailModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
        <div className="space-y-3 p-4 text-sm">{children}</div>
      </div>
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-0.5 break-words text-slate-800">{value}</div>
    </div>
  );
}

export function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
      {JSON.stringify(data ?? {}, null, 2)}
    </pre>
  );
}

export function ConfirmAction({
  show,
  message,
  onConfirm,
  onCancel,
}: {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmModal
      show={show}
      message={message}
      handleYes={onConfirm}
      handleNo={onCancel}
      handleClose={onCancel}
    />
  );
}

export function Btn({
  children,
  onClick,
  variant = "default",
  disabled,
  small,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger" | "ghost";
  disabled?: boolean;
  small?: boolean;
}) {
  const styles = {
    default: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md font-medium disabled:opacity-40 ${small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"} ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

const CHART_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#94a3b8"];

const SEGMENT_COLORS: Record<string, string> = {
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  grey: "#94a3b8",
  gray: "#94a3b8",
};

function resolveChartColor(color?: string, index = 0): string {
  if (!color) return CHART_COLORS[index % CHART_COLORS.length];
  return SEGMENT_COLORS[color.toLowerCase()] ?? color;
}

export function SimpleLineChart({
  title,
  subtitle,
  data,
  valueFormatter,
}: {
  title: string;
  subtitle?: string;
  data: Array<{ name: string; value: number }>;
  valueFormatter?: (value: number) => string;
}) {
  if (!data.length) {
    return (
      <div className="flex h-full min-h-[14rem] flex-col rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
        ) : null}
        <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
          No data available
        </div>
      </div>
    );
  }
  const formatValue = valueFormatter ?? ((v: number) => String(v));

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      ) : null}
      <div className="mt-3 min-h-[11rem] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="storageTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#64748b" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              width={48}
              tickFormatter={(v) => formatBytes(Number(v))}
            />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value) => [
                formatValue(Number(value ?? 0)),
                "Saved",
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#storageTrendFill)"
              dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SimpleBarChart({
  title,
  subtitle,
  data,
  dataKey = "value",
  nameKey = "name",
}: {
  title: string;
  subtitle?: string;
  data: Array<Record<string, string | number> & { color?: string }>;
  dataKey?: string;
  nameKey?: string;
}) {
  if (!data.length) return null;
  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      ) : null}
      <div className="mt-3 min-h-[11rem] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 48 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey={nameKey}
              tick={{ fontSize: 10, fill: "#64748b" }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={56}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              allowDecimals
              width={32}
            />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={resolveChartColor(
                    typeof entry.color === "string" ? entry.color : undefined,
                    i,
                  )}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SimplePieChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: Array<{ name: string; value: number; color?: string; percent?: number }>;
}) {
  const chartSegments = data.filter((d) => d.value > 0);
  if (!data.length) return null;

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      ) : null}
      <div className="mt-3 min-h-[11rem] flex-1">
        {chartSegments.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartSegments}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={68}
                paddingAngle={2}
              >
                {chartSegments.map((entry, i) => (
                  <Cell key={i} fill={resolveChartColor(entry.color, i)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value, name, item) => {
                  const pct = item.payload?.percent;
                  return [
                    pct != null
                      ? `${Number(value ?? 0).toLocaleString()} (${pct}%)`
                      : value,
                    name,
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No data
          </div>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {data.map((entry, i) => (
          <li
            key={entry.name}
            className="flex items-center gap-1.5 text-[11px] text-slate-500"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: resolveChartColor(entry.color, i) }}
            />
            {entry.name}
            {entry.percent != null ? ` (${entry.percent}%)` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UsageBar({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number | null;
  variant?: "default" | "systemRam";
}) {
  const pct = typeof value === "number" ? Math.min(100, Math.max(0, value)) : null;
  const tone =
    variant === "systemRam"
      ? getSystemRamBarColor(pct)
      : pct == null
        ? "bg-slate-200"
        : pct >= 85
          ? "bg-red-500"
          : pct >= 70
            ? "bg-amber-500"
            : "bg-emerald-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="tabular-nums text-slate-500">
          {pct == null ? "N/A" : `${pct}%`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct ?? 0}%` }} />
      </div>
    </div>
  );
}

export function RefreshBtn({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <Btn onClick={onClick} disabled={loading}>
      <span className="inline-flex items-center gap-1.5">
        <Activity className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </span>
    </Btn>
  );
}
