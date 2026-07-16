"use client";

import {
  AdminTable,
  Btn,
  DetailModal,
  DetailRow,
  FilterField,
  FilterGrid,
  JsonBlock,
  PageHeader,
  Pagination,
  RefreshBtn,
  StatusBadge,
  filterInputClass,
} from "@/app/admin/_components/adminUi";
import { formatDateTime } from "@/app/admin/_lib/format";
import {
  MOCK_LOGS,
  filterLogs,
  paginate,
} from "@/app/admin/_lib/mockData";
import type { WorkerLogRow } from "@/app/admin/_lib/types";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function LogsPageClient() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    store_hash: searchParams.get("store_hash") ?? "",
    worker_name: searchParams.get("worker_name") ?? "",
    queue_name: "",
    job_type: "",
    level: searchParams.get("level") ?? "",
    job_uuid: searchParams.get("job_uuid") ?? "",
    search: "",
    date_from: "",
    date_to: "",
  });
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<WorkerLogRow | null>(null);

  const data = useMemo(() => {
    const filtered = filterLogs(MOCK_LOGS, filters);
    return paginate(filtered, page, 20);
  }, [filters, page]);

  return (
    <div>
      <PageHeader
        title="Worker Logs"
        subtitle="Static demo · filters work on sample data"
        action={<RefreshBtn onClick={() => setPage(1)} loading={false} />}
      />

      <FilterGrid>
        {(
          [
            ["store_hash", "Store hash"],
            ["worker_name", "Worker"],
            ["queue_name", "Queue"],
            ["job_type", "Job type"],
            ["job_uuid", "Job UUID"],
            ["search", "Search"],
            ["date_from", "From (ISO)"],
            ["date_to", "To (ISO)"],
          ] as const
        ).map(([key, label]) => (
          <FilterField key={key} label={label}>
            <input
              className={filterInputClass}
              value={filters[key]}
              onChange={(e) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, [key]: e.target.value }));
              }}
            />
          </FilterField>
        ))}
        <FilterField label="Level">
          <select
            className={filterInputClass}
            value={filters.level}
            onChange={(e) => {
              setPage(1);
              setFilters((prev) => ({ ...prev, level: e.target.value }));
            }}
          >
            <option value="">All</option>
            {["info", "success", "warning", "error"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </FilterField>
      </FilterGrid>

      <AdminTable
        columns={[
          { key: "time", label: "Time" },
          { key: "level", label: "Level" },
          { key: "worker", label: "Worker" },
          { key: "store", label: "Store" },
          { key: "message", label: "Message" },
          { key: "action", label: "" },
        ]}
        rows={data.items.map((log) => ({
          id: log._id,
          className: log.level === "error" ? "bg-red-50/50" : "",
          cells: [
            <span key="t" className="whitespace-nowrap text-xs text-slate-500">
              {formatDateTime(log.created_at)}
            </span>,
            <StatusBadge key="l" status={log.level} />,
            <span key="w" className="text-xs">
              {log.worker_name ?? "—"}
            </span>,
            <span key="s" className="text-xs">
              {log.store_hash ?? "—"}
            </span>,
            <span key="m" className="line-clamp-2 text-xs text-slate-700">
              {log.message ?? "—"}
            </span>,
            <Btn key="a" small onClick={() => setDetail(log)}>
              Details
            </Btn>,
          ],
        }))}
      />
      <Pagination
        page={data.page}
        pages={data.pages}
        total={data.total}
        onPage={setPage}
      />

      <DetailModal
        open={!!detail}
        title="Log details"
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <>
            <DetailRow label="Level" value={<StatusBadge status={detail.level} />} />
            <DetailRow label="Message" value={detail.message ?? "—"} />
            <DetailRow label="Worker" value={detail.worker_name ?? "—"} />
            <DetailRow label="Queue" value={detail.queue_name ?? "—"} />
            <DetailRow label="Store" value={detail.store_hash ?? "—"} />
            <DetailRow label="Job UUID" value={detail.job_uuid ?? "—"} />
            <DetailRow label="Created" value={formatDateTime(detail.created_at)} />
            {detail.error_message ? (
              <DetailRow label="Error" value={detail.error_message} />
            ) : null}
            {detail.error_stack ? (
              <DetailRow
                label="Stack"
                value={
                  <pre className="max-h-40 overflow-auto text-xs">
                    {detail.error_stack}
                  </pre>
                }
              />
            ) : null}
            <DetailRow label="Context" value={<JsonBlock data={detail.context} />} />
          </>
        ) : null}
      </DetailModal>
    </div>
  );
}
