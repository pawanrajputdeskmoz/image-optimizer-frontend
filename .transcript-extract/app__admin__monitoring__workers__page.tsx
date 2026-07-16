"use client";

import { adminApi } from "@/app/admin/_lib/adminApi";
import {
  Btn,
  ConfirmAction,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  RefreshBtn,
  StatusBadge,
} from "@/app/admin/_components/adminUi";
import { formatRelativeTime } from "@/app/admin/_lib/format";
import type { WorkerRow } from "@/app/admin/_lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const DANGEROUS = new Set(["stop", "restart"]);

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ name: string; action: string } | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApi.workers();
    if (res.error) {
      setError(res.error);
    } else {
      setWorkers((res.data as WorkerRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  async function runAction(name: string, action: string) {
    setActing(name);
    const res = await adminApi.workerAction(name, action);
    setActing(null);
    setPending(null);
    if (res.error) return;
    toast.success(`Worker ${action} requested`);
    void load();
  }

  if (loading && !workers.length) return <LoadingBlock />;
  if (error && !workers.length) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title="Workers"
        subtitle="12 background workers · live heartbeat"
        action={<RefreshBtn onClick={load} loading={loading} />}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {workers.map((w) => (
          <div
            key={w.worker_name}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{w.worker_name}</p>
                <p className="text-xs text-slate-500">{w.queue_name}</p>
              </div>
              <StatusBadge status={w.status} />
            </div>

            <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-500">
              <div>
                <dt>Last seen</dt>
                <dd className="font-medium text-slate-700">
                  {formatRelativeTime(w.last_seen)}
                </dd>
              </div>
              <div>
                <dt>Processed today</dt>
                <dd className="font-medium text-slate-700">{w.processed_jobs_today}</dd>
              </div>
              <div>
                <dt>Failed today</dt>
                <dd className="font-medium text-slate-700">{w.failed_jobs_today}</dd>
              </div>
              <div>
                <dt>Host</dt>
                <dd className="truncate font-medium text-slate-700">
                  {w.server_hostname ?? "—"}
                </dd>
              </div>
            </dl>

            {w.current_job_uuid ? (
              <p className="mt-2 truncate text-[11px] text-slate-500">
                Job: {w.current_job_type} · {w.current_job_uuid}
              </p>
            ) : null}

            {w.last_error_message ? (
              <p className="mt-1 line-clamp-2 text-[11px] text-red-600">
                {w.last_error_message}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1">
              <Link href={`/admin/monitoring/logs?worker_name=${encodeURIComponent(w.worker_name)}`}>
                <Btn small>Logs</Btn>
              </Link>
              {w.allowed_actions?.map((action) => (
                <Btn
                  key={action}
                  small
                  variant={DANGEROUS.has(action) ? "danger" : "default"}
                  disabled={acting === w.worker_name}
                  onClick={() => {
                    if (DANGEROUS.has(action)) {
                      setPending({ name: w.worker_name, action });
                    } else {
                      void runAction(w.worker_name, action);
                    }
                  }}
                >
                  {action}
                </Btn>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConfirmAction
        show={!!pending}
        message={`Are you sure you want to ${pending?.action} worker "${pending?.name}"?`}
        onConfirm={() => pending && void runAction(pending.name, pending.action)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
