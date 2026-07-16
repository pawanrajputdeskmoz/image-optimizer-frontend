"use client";

import { adminApi } from "@/app/admin/_lib/adminApi";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  RefreshBtn,
  SimpleBarChart,
  StatCard,
  StatusBadge,
  UsageBar,
} from "@/app/admin/_components/adminUi";
import { formatDateTime } from "@/app/admin/_lib/format";
import type { ServerHealth } from "@/app/admin/_lib/types";
import { useCallback, useEffect, useState } from "react";

export default function ServerHealthPage() {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApi.serverHealth();
    if (res.error) {
      setError(res.error);
      setHealth(null);
    } else {
      setHealth(res.data as ServerHealth);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !health) return <LoadingBlock />;
  if (error && !health) return <ErrorBlock message={error} onRetry={load} />;

  const h = health!;
  const workerChart = [
    { name: "Active", value: h.active_workers },
    { name: "Inactive", value: Math.max(0, h.total_workers - h.active_workers) },
  ];

  return (
    <div>
      <PageHeader
        title="Server Health"
        subtitle={`Last checked ${formatDateTime(h.last_checked_at)}`}
        action={<RefreshBtn onClick={load} loading={loading} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active workers" value={`${h.active_workers} / ${h.total_workers}`} />
        <StatCard label="Queue backlog" value={h.queue_backlog} tone="warning" />
        <StatCard label="Redis" value={<StatusBadge status={h.redis_status} />} />
        <StatCard label="Database" value={<StatusBadge status={h.database_status} />} />
        <StatCard label="Uptime" value={h.server_uptime} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold text-slate-600">Resource usage</p>
          <div className="space-y-4">
            <UsageBar label="RAM" value={h.ram_usage} />
            <UsageBar label="Disk" value={h.disk_usage} />
            <UsageBar label="CPU" value={h.cpu_usage} />
          </div>
        </div>
        <SimpleBarChart title="Workers active vs inactive" data={workerChart} />
      </div>
    </div>
  );
}
