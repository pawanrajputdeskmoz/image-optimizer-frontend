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
  MOCK_ALERTS,
  filterAlerts,
  paginate,
} from "@/app/admin/_lib/mockData";
import type { AlertRow } from "@/app/admin/_lib/types";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function AlertsPage() {
  const [filters, setFilters] = useState({ status: "active", severity: "" });
  const [page, setPage] = useState(1);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [detail, setDetail] = useState<AlertRow | null>(null);

  const data = useMemo(() => {
    const filtered = filterAlerts(alerts, filters);
    return paginate(filtered, page, 20);
  }, [alerts, filters, page]);

  function resolve(id: string) {
    setAlerts((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status: "resolved" } : a)),
    );
    toast.success("Alert resolved (demo)");
    setDetail(null);
  }

  function mute(id: string) {
    setAlerts((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status: "muted" } : a)),
    );
    toast.success("Alert muted (demo)");
    setDetail(null);
  }

  return (
    <div>
      <PageHeader
        title="Alerts"
        subtitle="Static demo data"
        action={<RefreshBtn onClick={() => setAlerts(MOCK_ALERTS)} loading={false} />}
      />

      <FilterGrid>
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
            {["active", "resolved", "muted"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Severity">
          <select
            className={filterInputClass}
            value={filters.severity}
            onChange={(e) => {
              setPage(1);
              setFilters((p) => ({ ...p, severity: e.target.value }));
            }}
          >
            <option value="">All</option>
            {["low", "medium", "high", "critical"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FilterField>
      </FilterGrid>

      <AdminTable
        columns={[
          { key: "title", label: "Title" },
          { key: "type", label: "Type" },
          { key: "severity", label: "Severity" },
          { key: "worker", label: "Worker" },
          { key: "sent", label: "Last sent" },
          { key: "status", label: "Status" },
          { key: "actions", label: "" },
        ]}
        rows={data.items.map((a) => ({
          id: a._id,
          className:
            a.severity === "critical" || a.severity === "high"
              ? "bg-red-50/30"
              : "",
          cells: [
            <span key="t" className="text-xs font-medium">
              {a.title ?? "—"}
            </span>,
            a.alert_type ?? "—",
            <StatusBadge key="sev" status={a.severity} />,
            a.worker_name ?? "—",
            formatDateTime(a.last_sent_at),
            <StatusBadge key="st" status={a.status} />,
            <Btn key="d" small onClick={() => setDetail(a)}>
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
        title={detail?.title ?? "Alert details"}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <>
            <DetailRow label="Message" value={detail.message ?? "—"} />
            <DetailRow label="Severity" value={<StatusBadge status={detail.severity} />} />
            <DetailRow label="Explanation" value={detail.brief_explanation ?? "—"} />
            <DetailRow label="Possible reason" value={detail.possible_reason ?? "—"} />
            <DetailRow
              label="Recommended action"
              value={detail.recommended_action ?? "—"}
            />
            <DetailRow
              label="Email recipients"
              value={detail.email_recipients?.join(", ") ?? "—"}
            />
            <DetailRow label="Context" value={<JsonBlock data={detail.context} />} />
            {detail.related_logs?.length ? (
              <DetailRow
                label="Related logs"
                value={
                  <ul className="max-h-32 space-y-1 overflow-auto text-xs">
                    {detail.related_logs.map((l) => (
                      <li key={l._id}>{l.message}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}
            <div className="flex gap-2 pt-2">
              <Btn onClick={() => resolve(detail._id)}>Resolve</Btn>
              <Btn variant="ghost" onClick={() => mute(detail._id)}>
                Mute
              </Btn>
            </div>
          </>
        ) : null}
      </DetailModal>
    </div>
  );
}
