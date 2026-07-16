"use client";

import {
  AdminTable,
  Btn,
  DetailModal,
  DetailRow,
  FilterField,
  FilterGrid,
  PageHeader,
  Pagination,
  RefreshBtn,
  SimpleBarChart,
  StatCard,
  filterInputClass,
} from "@/app/admin/_components/adminUi";
import { formatBytes, formatDateTime, formatRelativeTime } from "@/app/admin/_lib/format";
import {
  MOCK_CLIENTS,
  filterClients,
  paginate,
} from "@/app/admin/_lib/mockData";
import type { ClientRow } from "@/app/admin/_lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";

function ClientStatusBadge({ status }: { status: ClientRow["status"] }) {
  const styles: Record<ClientRow["status"], string> = {
    active: "bg-emerald-100 text-emerald-700",
    trial: "bg-amber-100 text-amber-800",
    suspended: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: ClientRow["plan"] }) {
  const styles: Record<ClientRow["plan"], string> = {
    free: "bg-slate-100 text-slate-600",
    starter: "bg-blue-100 text-blue-700",
    pro: "bg-sky-100 text-sky-700",
    enterprise: "bg-violet-100 text-violet-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${styles[plan]}`}
    >
      {plan}
    </span>
  );
}

export default function ClientsPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    plan: "",
  });
  const [page, setPage] = useState(1);
  const [clients, setClients] = useState(MOCK_CLIENTS);
  const [detail, setDetail] = useState<ClientRow | null>(null);

  const data = useMemo(() => {
    const filtered = filterClients(clients, filters);
    return paginate(filtered, page, 10);
  }, [clients, filters, page]);

  const activeCount = clients.filter((c) => c.status === "active").length;
  const trialCount = clients.filter((c) => c.status === "trial").length;
  const totalOptimized = clients.reduce((sum, c) => sum + c.optimized_images, 0);
  const totalSaved = clients.reduce((sum, c) => sum + c.total_saved_size, 0);

  const planChart = ["free", "starter", "pro", "enterprise"].map((plan) => ({
    name: plan,
    value: clients.filter((c) => c.plan === plan).length,
  }));

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Installed stores · static demo data"
        action={
          <RefreshBtn onClick={() => setClients(MOCK_CLIENTS)} loading={false} />
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clients" value={clients.length} />
        <StatCard label="Active" value={activeCount} tone="success" />
        <StatCard label="On trial" value={trialCount} tone="warning" />
        <StatCard
          label="Total saved"
          value={formatBytes(totalSaved)}
          hint={`${totalOptimized.toLocaleString()} images optimized`}
        />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FilterGrid>
            <FilterField label="Search">
              <input
                className={filterInputClass}
                placeholder="Store name, hash, email…"
                value={filters.search}
                onChange={(e) => {
                  setPage(1);
                  setFilters((p) => ({ ...p, search: e.target.value }));
                }}
              />
            </FilterField>
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
                {["active", "trial", "suspended"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Plan">
              <select
                className={filterInputClass}
                value={filters.plan}
                onChange={(e) => {
                  setPage(1);
                  setFilters((p) => ({ ...p, plan: e.target.value }));
                }}
              >
                <option value="">All</option>
                {["free", "starter", "pro", "enterprise"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FilterField>
          </FilterGrid>
        </div>
        <SimpleBarChart title="Clients by plan" data={planChart} />
      </div>

      <AdminTable
        columns={[
          { key: "store", label: "Store" },
          { key: "plan", label: "Plan" },
          { key: "status", label: "Status" },
          { key: "images", label: "Images" },
          { key: "saved", label: "Saved" },
          { key: "jobs", label: "Pending jobs" },
          { key: "active", label: "Last active" },
          { key: "actions", label: "" },
        ]}
        rows={data.items.map((client) => ({
          id: client._id,
          className: client.status === "suspended" ? "opacity-60" : "",
          cells: [
            <div key="store" className="min-w-[140px]">
              <p className="text-xs font-medium text-slate-800">{client.store_name}</p>
              <p className="font-mono text-[11px] text-slate-500">{client.store_hash}</p>
            </div>,
            <PlanBadge key="plan" plan={client.plan} />,
            <ClientStatusBadge key="status" status={client.status} />,
            <span key="img" className="text-xs tabular-nums">
              {client.optimized_images.toLocaleString()} /{" "}
              {client.total_images.toLocaleString()}
              {client.failed_images > 0 ? (
                <span className="text-red-600"> · {client.failed_images} failed</span>
              ) : null}
            </span>,
            <span key="saved" className="text-xs tabular-nums">
              {formatBytes(client.total_saved_size)}
              <br />
              <span className="text-slate-400">
                avg {client.average_compression_percent}%
              </span>
            </span>,
            <span
              key="jobs"
              className={`text-xs tabular-nums ${client.pending_jobs > 20 ? "font-medium text-amber-700" : ""}`}
            >
              {client.pending_jobs}
            </span>,
            <span key="active" className="whitespace-nowrap text-xs text-slate-500">
              {formatRelativeTime(client.last_active_at)}
            </span>,
            <Btn key="detail" small onClick={() => setDetail(client)}>
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
        title={detail?.store_name ?? "Client details"}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <>
            <DetailRow label="Store hash" value={detail.store_hash} />
            <DetailRow
              label="Store URL"
              value={
                <a
                  href={detail.store_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline"
                >
                  {detail.store_url}
                </a>
              }
            />
            <DetailRow label="Platform" value={detail.platform} />
            <DetailRow label="Plan" value={<PlanBadge plan={detail.plan} />} />
            <DetailRow label="Status" value={<ClientStatusBadge status={detail.status} />} />
            <DetailRow label="Owner email" value={detail.owner_email} />
            <DetailRow label="Channels" value={detail.channel_count} />
            <DetailRow label="Installed" value={formatDateTime(detail.installed_at)} />
            <DetailRow
              label="Last active"
              value={formatRelativeTime(detail.last_active_at)}
            />
            <DetailRow
              label="Images"
              value={`${detail.optimized_images.toLocaleString()} optimized · ${detail.pending_images.toLocaleString()} pending · ${detail.failed_images} failed`}
            />
            <DetailRow
              label="Storage saved"
              value={`${formatBytes(detail.total_saved_size)} (avg ${detail.average_compression_percent}% compression)`}
            />
            <DetailRow label="Pending jobs" value={detail.pending_jobs} />
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href={`/admin/monitoring/image-stats?store_hash=${detail.store_hash}`}>
                <Btn small>Image stats</Btn>
              </Link>
              <Link href={`/admin/monitoring/logs?store_hash=${detail.store_hash}`}>
                <Btn small>View logs</Btn>
              </Link>
              <Link href={`/admin/monitoring/failed-jobs?store_hash=${detail.store_hash}`}>
                <Btn small>Failed jobs</Btn>
              </Link>
            </div>
          </>
        ) : null}
      </DetailModal>
    </div>
  );
}
