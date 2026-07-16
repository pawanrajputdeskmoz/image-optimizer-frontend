"use client";

import {
  LoadingBlock,
  PageHeader,
  RefreshBtn,
  ServerHealthPanel,
} from "@/app/admin/_components/adminUi";
import { adminApi } from "@/app/admin/_lib/adminApi";
import type { AdminHealthData } from "@/app/admin/_lib/types";
import { useCallback, useEffect, useState } from "react";

export default function ServerHealthPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState<AdminHealthData | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const res = await adminApi.serverHealth();
    setHealth(res.data ?? null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // Initial data fetch on mount; state updates happen after the awaited response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (loading) return <LoadingBlock label="Loading server health…" />;

  return (
    <div>
      <PageHeader
        title="Server Health"
        subtitle="Live RAM, disk, services, and process status"
        action={<RefreshBtn onClick={() => void load(true)} loading={refreshing} />}
      />

      {health ? (
        <ServerHealthPanel health={health} />
      ) : (
        <p className="text-sm text-slate-500">Unable to load server health.</p>
      )}

      {health?.recent_alerts?.length ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-slate-600">Active alerts</p>
          <ul className="space-y-2">
            {health.recent_alerts.map((a, i) => (
              <li
                key={`${a.source ?? "alert"}-${i}`}
                className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
              >
                <span className="text-slate-700">{a.message}</span>
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-amber-800">
                  {a.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
