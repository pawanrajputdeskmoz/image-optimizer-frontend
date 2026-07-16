"use client";

import {
  Btn,
  ConfirmAction,
  PageHeader,
  RefreshBtn,
  StatusBadge,
} from "@/app/admin/_components/adminUi";
import { formatRelativeTime } from "@/app/admin/_lib/format";
import { MOCK_WORKERS } from "@/app/admin/_lib/mockData";
import type { WorkerRow } from "@/app/admin/_lib/types";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const DANGEROUS = new Set(["stop", "restart"]);

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerRow[]>(MOCK_WORKERS);
  const [pending, setPending] = useState<{ name: string; action: string } | null>(null);

  function runAction(name: string, action: string) {
    setPending(null);
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.worker_name !== name) return w;
        if (action === "pause") return { ...w, status: "paused" };
        if (action === "resume" || action === "start") return { ...w, status: "running" };
        if (action === "stop") return { ...w, status: "stopped" };
        return w;
      }),
    );
    toast.success(`Worker ${action} (demo)`);
  }

  return (
    <div>
      <PageHeader
        title="Workers"
        subtitle="12 background workers · static demo data"
        action={<RefreshBtn onClick={() => setWorkers(MOCK_WORKERS)} loading={false} />}
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
              <Link
                href={`/admin/monitoring/logs?worker_name=${encodeURIComponent(w.worker_name)}`}
              >
                <Btn small>Logs</Btn>
              </Link>
              {w.allowed_actions?.map((action) => (
                <Btn
                  key={action}
                  small
                  variant={DANGEROUS.has(action) ? "danger" : "default"}
                  onClick={() => {
                    if (DANGEROUS.has(action)) {
                      setPending({ name: w.worker_name, action });
                    } else {
                      runAction(w.worker_name, action);
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
        onConfirm={() => pending && runAction(pending.name, pending.action)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
