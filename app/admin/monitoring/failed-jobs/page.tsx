"use client";

import {
  AdminTable,
  Btn,
  ConfirmAction,
  FilterField,
  FilterGrid,
  PageHeader,
  Pagination,
  RefreshBtn,
  StatusBadge,
  filterInputClass,
} from "@/app/admin/_components/adminUi";
import { formatDateTime } from "@/app/admin/_lib/format";
import {
  MOCK_FAILED_JOBS,
  filterFailedJobs,
  paginate,
} from "@/app/admin/_lib/mockData";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function FailedJobsPage() {
  const [filters, setFilters] = useState({
    store_hash: "",
    worker_name: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState(MOCK_FAILED_JOBS);
  const [confirm, setConfirm] = useState<{
    id: string;
    action: "retry" | "ignore";
  } | null>(null);

  const data = useMemo(() => {
    const filtered = filterFailedJobs(jobs, filters);
    return paginate(filtered, page, 20);
  }, [jobs, filters, page]);

  function runAction() {
    if (!confirm) return;
    setJobs((prev) =>
      prev.map((job) => {
        if (job._id !== confirm.id) return job;
        return {
          ...job,
          status: confirm.action === "retry" ? "retried" : "ignored",
          retry_count: (job.retry_count ?? 0) + (confirm.action === "retry" ? 1 : 0),
        };
      }),
    );
    toast.success(
      confirm.action === "retry" ? "Job re-queued (demo)" : "Job ignored (demo)",
    );
    setConfirm(null);
  }

  return (
    <div>
      <PageHeader
        title="Failed Jobs"
        subtitle="Static demo data"
        action={<RefreshBtn onClick={() => setJobs(MOCK_FAILED_JOBS)} loading={false} />}
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
              <Btn small onClick={() => setConfirm({ id: job._id, action: "retry" })}>
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

      <ConfirmAction
        show={!!confirm}
        message={`Confirm ${confirm?.action} for this failed job?`}
        onConfirm={runAction}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
