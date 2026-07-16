"use client";

import {
  AdminTable,
  FilterField,
  FilterGrid,
  PageHeader,
  Pagination,
  RefreshBtn,
  SimpleBarChart,
  SimplePieChart,
  StatCard,
  StatusBadge,
  filterInputClass,
} from "@/app/admin/_components/adminUi";
import { formatBytes, formatDateTime } from "@/app/admin/_lib/format";
import {
  MOCK_IMAGE_STATS,
  MOCK_IMAGE_SUMMARY,
  filterImageStats,
  paginate,
} from "@/app/admin/_lib/mockData";
import { useMemo, useState } from "react";

export default function ImageStatsPage() {
  const [filters, setFilters] = useState({
    store_hash: "",
    source_type: "",
    status: "",
    date_from: "",
    date_to: "",
  });
  const [page, setPage] = useState(1);
  const summary = MOCK_IMAGE_SUMMARY;

  const data = useMemo(() => {
    const filtered = filterImageStats(MOCK_IMAGE_STATS, filters);
    return paginate(filtered, page, 20);
  }, [filters, page]);

  const chartData = [
    { name: "Optimized", value: summary.optimized_images },
    { name: "Failed", value: summary.failed_images },
    { name: "Pending", value: summary.pending_images },
    { name: "Skipped", value: summary.skipped_images },
  ];

  const sizeChart = [
    { name: "Original", value: Math.round(summary.total_original_size / 1024 / 1024) },
    { name: "Optimized", value: Math.round(summary.total_optimized_size / 1024 / 1024) },
    { name: "Saved", value: Math.round(summary.total_saved_size / 1024 / 1024) },
  ];

  return (
    <div>
      <PageHeader
        title="Image Optimization Stats"
        subtitle="Static demo data"
        action={<RefreshBtn onClick={() => setPage(1)} loading={false} />}
      />

      <FilterGrid>
        <FilterField label="Store hash">
          <input
            className={filterInputClass}
            value={filters.store_hash}
            onChange={(e) => {
              setPage(1);
              setFilters((p) => ({ ...p, store_hash: e.target.value }));
            }}
          />
        </FilterField>
        <FilterField label="Source type">
          <select
            className={filterInputClass}
            value={filters.source_type}
            onChange={(e) => {
              setPage(1);
              setFilters((p) => ({ ...p, source_type: e.target.value }));
            }}
          >
            <option value="">All</option>
            {["product", "category", "brand", "home_banner", "widget", "content_page"].map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ),
            )}
          </select>
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
            {["pending", "optimized", "failed", "skipped"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="From">
          <input
            type="date"
            className={filterInputClass}
            value={filters.date_from}
            onChange={(e) => {
              setPage(1);
              setFilters((p) => ({ ...p, date_from: e.target.value }));
            }}
          />
        </FilterField>
        <FilterField label="To">
          <input
            type="date"
            className={filterInputClass}
            value={filters.date_to}
            onChange={(e) => {
              setPage(1);
              setFilters((p) => ({ ...p, date_to: e.target.value }));
            }}
          />
        </FilterField>
      </FilterGrid>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total" value={summary.total_images} />
        <StatCard label="Optimized" value={summary.optimized_images} tone="success" />
        <StatCard label="Failed" value={summary.failed_images} tone="danger" />
        <StatCard label="Pending" value={summary.pending_images} tone="warning" />
        <StatCard
          label="Saved"
          value={formatBytes(summary.total_saved_size)}
          hint={`Avg ${summary.average_compression_percent?.toFixed?.(1) ?? 0}%`}
        />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <SimplePieChart title="Images by status" data={chartData} />
        <SimpleBarChart
          title="Size comparison (MB)"
          data={sizeChart}
          nameKey="name"
          dataKey="value"
        />
      </div>

      <p className="mb-2 text-xs text-slate-500">
        Last optimized: {formatDateTime(summary.last_optimized_at)}
      </p>

      <AdminTable
        columns={[
          { key: "store", label: "Store" },
          { key: "source", label: "Source" },
          { key: "sizes", label: "Sizes" },
          { key: "compression", label: "Compression" },
          { key: "status", label: "Status" },
          { key: "at", label: "Optimized at" },
        ]}
        rows={data.items.map((row) => ({
          id: row._id,
          cells: [
            row.store_hash ?? "—",
            <span key="s" className="text-xs">
              {row.source_type} · {row.source_id ?? "—"} · img {row.image_id ?? "—"}
            </span>,
            <span key="sz" className="text-xs tabular-nums">
              {formatBytes(row.original_size)} → {formatBytes(row.optimized_size)}
              <br />
              saved {formatBytes(row.saved_size)}
            </span>,
            `${row.compression_percent ?? 0}%`,
            <StatusBadge key="st" status={row.status} />,
            formatDateTime(row.optimized_at),
          ],
        }))}
      />
      <Pagination
        page={data.page}
        pages={data.pages}
        total={data.total}
        onPage={setPage}
      />
    </div>
  );
}
