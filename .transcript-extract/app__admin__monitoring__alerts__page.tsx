"use client";

import { adminApi } from "@/app/admin/_lib/adminApi";
import {
  AdminTable,
  Btn,
  DetailModal,
  DetailRow,
  ErrorBlock,
  FilterField,
  FilterGrid,
  JsonBlock,
  LoadingBlock,
  PageHeader,
  Pagination,
  RefreshBtn,
  StatusBadge,
  filterInputClass,
} from "@/app/admin/_components/adminUi";
import { formatDateTime } from "@/app/admin/_lib/format";
import type { AlertRow, Paginated } from "@/app/admin/_lib/types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function AlertsPage() {
  const [filters, setFilters] = useState({ status: "active", severity: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AlertRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AlertRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminApi.alerts({ ...filters, page, limit: 20 });
    if (res.error) {
      setError(res.error);
      setData(null);
    } else {
      setData(res.data as Paginated<AlertRow>);
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(id: string) {
    const res = await adminApi.alert(id);
    if (res.data) setDetail(res.data as AlertRow);
  }

  async function resolve(id: string) {
    const res = await adminApi.resolveAlert(id);
    if (res.error) return;
    toast.success("Alert resolved");
    setDetail(null);
    void load();
  }

  async function mute(id: string) {
    const res = await adminApi.muteAlert(id);
    if (res.error) return;
    toast.success("Alert muted");
    setDetail(null);
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Alerts"
        action={<RefreshBtn onClick={load} loading={loading} />}
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

      {loading && !data ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={load} /> : null}

      {data ? (
        <>
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
                <Btn key="d" small onClick={() => void openDetail(a._id)}>
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
        </>
      ) : null}

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
            <DetailRow label="Recommended action" value={detail.recommended_action ?? "—"} />
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
              <Btn onClick={() => void resolve(detail._id)}>Resolve</Btn>
              <Btn variant="ghost" onClick={() => void mute(detail._id)}>
                Mute
              </Btn>
            </div>
          </>
        ) : null}
      </DetailModal>
    </div>
  );
}
