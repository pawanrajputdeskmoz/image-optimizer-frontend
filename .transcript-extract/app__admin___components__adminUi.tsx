"use client";

import ConfirmModal from "@/app/_components/confirmation";
import Spinner from "@/app/_components/ui/Spinner";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
  List,
  LogOut,
  Server,
  Users,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const NAV = [
  { href: "/admin/monitoring", label: "Dashboard", icon: LayoutDashboard },
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
  warning: "bg-amber-100 text-amber-800",
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
  optimized: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-800",
  skipped: "bg-gray-100 text-gray-600",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
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
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("admin_token");
            router.replace("/admin/monitoring/login");
          }}
          className="m-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
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
  action?: React.ReactNode;
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

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "border-slate-200",
    success: "border-emerald-200 bg-emerald-50/40",
    warning: "border-amber-200 bg-amber-50/40",
    danger: "border-red-200 bg-red-50/40",
  };
  return (
    <div className={`rounded-xl border bg-white p-3 ${tones[tone]}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
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
  rows: { id: string; cells: React.ReactNode[]; className?: string }[];
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

export function FilterGrid({ children }: { children: React.ReactNode }) {
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
  children: React.ReactNode;
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
  children: React.ReactNode;
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

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
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
  children: React.ReactNode;
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

export function SimpleBarChart({
  title,
  data,
  dataKey = "value",
  nameKey = "name",
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  dataKey?: string;
  nameKey?: string;
}) {
  if (!data.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-slate-600">{title}</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
  data,
}: {
  title: string;
  data: Array<{ name: string; value: number }>;
}) {
  const filtered = data.filter((d) => d.value > 0);
  if (!filtered.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs font-semibold text-slate-600">{title}</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={2}
            >
              {filtered.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function UsageBar({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const pct = typeof value === "number" ? Math.min(100, Math.max(0, value)) : null;
  const tone =
    pct == null
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
