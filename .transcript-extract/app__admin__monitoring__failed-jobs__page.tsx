"use client";

import { adminApi } from "@/app/admin/_lib/adminApi";
import {
  AdminTable,
  Btn,
  ConfirmAction,
  ErrorBlock,
  FilterField,
  FilterGrid,
  LoadingBlock,
  PageHeader,
  Pagination,
  RefreshBtn,
  StatusBadge,
  filterInputClass,
} from "@/app/admin/_components/adminUi";
import { formatDateTime } from "@/app/admin/_lib/format";
import type { FailedJobRow, Paginated } from "@/app/admin/_lib/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function FailedJobsPage() {
  const [filters, setFilters] = useState({
    store_hash: "",
    worker_name: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<FailedJobRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    id: string;
    action: "retry" | "ignore";
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApi.failedJobs({ ...filters, page, limit: 20 });
    if (res.error) {
      setError(res.error);
      setData(null);
    } else {
      setData(res.data as Paginated<FailedJobRow>);
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction() {
    if (!confirm) return;
    const fn =
      confirm.action === "retry"
        ? adminApi.retryFailedJob
        : adminApi.ignoreFailedJob;
    const res = await fn(confirm.id);
    setConfirm(null);
    if (res.error) return;
    toast.success(confirm.action === "retry" ? "Job re-queued" : "Job ignored");
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Failed Jobs"
        action={<RefreshBtn onClick={load} loading={loading} />}
      />

      <FilterGrid>
        {(
          [
            ["store_hash", "Store hash"],
            ["worker_name", "Worker"],
          ] as const
        ).map(([key, label]) => (
          <FilterField key={key} label={label}>
            <input
              className={filterInputClass}
              value={filters[key]}
              onChange={(e) => {
                setPage(1);
                setFilters((p) => ({ ...p, [key]: e.target.value }));
              }}
            />
          </FilterField>
        ))}
        <FilterField label="Status">
          <select
            className={filterInputClass}
            value={filters.status}
            onChange={(e) => {
              setPage(1);
              setFilters((p) => ({ ...p, status: e.target.value }));
            }}
          >
            <option value="">All</option>
            <option value="failed">failed</option>
            <option value="retried">retried</option>
            <option value="ignored">ignored</option>
          </select>
        </FilterField>
      </FilterGrid>

      {loading && !data ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={load} /> : null}

      {data ? (
        <>
          <AdminTable
            columns={[
              { key: "time", label: "Failed" },
              { key: "job", label: "Job UUID" },
              { key: "store", label: "Store" },
              { key: "type", label: "Type" },
              { key: "error", label: "Error" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Actions" },
            ]}
            rows={data.items.map((job) => ({
              id: job._id,
              cells: [
                formatDateTime(job.failed_at),
                <span key="j" className="font-mono text-xs">
                  {job.job_uuid ?? "—"}
                </span>,
                job.store_hash ?? "—",
                job.job_type ?? "—",
                <span key="e" className="line-clamp-2 text-xs text-red-600">
                  {job.error_reason ?? "—"}
                </span>,
                <StatusBadge key="s" status={job.status} />,
                <div key="a" className="flex flex-wrap gap-1">
                  <Btn
                    small
                    onClick={() => setConfirm({ id: job._id, action: "retry" })}
                  >
                    Retry
                  </Btn>
                  <Btn
                    small
                    variant="ghost"
                    onClick={() => setConfirm({ id: job._id, action: "ignore" })}
                  >
                    Ignore
                  </Btn>
                  {job.job_uuid ? (
                    <Link
                      href={`/admin/monitoring/logs?job_uuid=${encodeURIComponent(job.job_uuid)}`}
                    >
                      <Btn small>Logs</Btn>
                    </Link>
                  ) : null}
                </div>,
              ],
            }))}
          />
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onPage={setPage}
          />
        </>
      ) : null}

      <ConfirmAction
        show={!!confirm}
        message={`Confirm ${confirm?.action} for this failed job?`}
        onConfirm={() => void runAction()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
