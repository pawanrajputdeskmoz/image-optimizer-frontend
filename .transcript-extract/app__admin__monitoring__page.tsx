"use client";

import { adminApi } from "@/app/admin/_lib/adminApi";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  RefreshBtn,
  SimpleBarChart,
  SimplePieChart,
  StatCard,
  StatusBadge,
  UsageBar,
} from "@/app/admin/_components/adminUi";
import { formatBytes, formatDateTime, formatRelativeTime } from "@/app/admin/_lib/format";
import type { DashboardData } from "@/app/admin/_lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApi.dashboard();
    if (res.error) {
      setError(res.error);
      setData(null);
    } else {
      setData(res.data as DashboardData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !data) return <LoadingBlock />;
  if (error && !data) return <ErrorBlock message={error} onRetry={load} />;

  const d = data!;
  const workerChart = [
    { name: "Running", value: d.workers.running },
    { name: "Stopped", value: d.workers.stopped },
    { name: "Paused", value: d.workers.paused },
    { name: "No reply", value: d.workers.not_responding },
  ];
  const imageChart = [
    { name: "Optimized", value: d.image_optimization.optimized_images },
    { name: "Failed", value: d.image_optimization.failed_images },
  ];
  const topQueues = (d.queues.queues ?? [])
    .map((q) => ({
      name: (q.queue_name ?? "").replace(/-supervisor$/, "").slice(0, 12),
      value: (q.waiting ?? 0) + (q.failed ?? 0),
    }))
    .filter((q) => q.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live worker, queue, and optimization overview"
        action={<RefreshBtn onClick={load} loading={loading} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total workers" value={d.workers.total} />
        <StatCard label="Running" value={d.workers.running} tone="success" />
        <StatCard label="Pending jobs" value={d.queues.pending_jobs} tone="warning" />
        <StatCard label="Failed jobs" value={d.queues.failed_jobs} tone="danger" />
        <StatCard label="Optimized images" value={d.image_optimization.optimized_images.toLocaleString()} />
        <StatCard
          label="Total saved"
          value={formatBytes(d.image_optimization.total_saved_size)}
          hint={`Avg ${d.image_optimization.average_compression_percent}%`}
        />
        <StatCard
          label="Redis"
          value={<StatusBadge status={d.server.redis_status} />}
        />
        <StatCard
          label="Database"
          value={<StatusBadge status={d.server.database_status} />}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <SimplePieChart title="Worker status" data={workerChart} />
        <SimplePieChart title="Image optimization" data={imageChart} />
        <SimpleBarChart title="Queue load (waiting + failed)" data={topQueues} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-slate-600">Server health</p>
          <div className="space-y-3">
            <UsageBar label="RAM" value={d.server.ram_usage} />
            <UsageBar label="Disk" value={d.server.disk_usage} />
            <p className="text-xs text-slate-500">Uptime: {d.server.uptime}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">Recent alerts</p>
            <Link href="/admin/monitoring/alerts" className="text-xs text-slate-500 hover:underline">
              View all
            </Link>
          </div>
          {!d.recent_alerts?.length ? (
            <p className="text-xs text-slate-400">No active alerts</p>
          ) : (
            <ul className="space-y-2">
              {d.recent_alerts.map((a) => (
                <li key={a._id} className="flex items-start justify-between gap-2 text-xs">
                  <span className="text-slate-700">{a.title ?? a.message}</span>
                  <StatusBadge status={a.severity} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-600">Recent error logs</p>
          <Link href="/admin/monitoring/logs?level=error" className="text-xs text-slate-500 hover:underline">
            View all
          </Link>
        </div>
        {!d.recent_error_logs?.length ? (
          <p className="text-xs text-slate-400">No recent errors</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {d.recent_error_logs.map((log) => (
              <li key={log._id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                <span className="text-slate-700">{log.message}</span>
                <span className="text-slate-400" title={formatDateTime(log.created_at)}>
                  {formatRelativeTime(log.created_at)} · {log.worker_name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
