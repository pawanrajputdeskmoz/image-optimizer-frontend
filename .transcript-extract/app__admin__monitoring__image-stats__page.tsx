"use client";

import { adminApi } from "@/app/admin/_lib/adminApi";
import {
  AdminTable,
  ErrorBlock,
  FilterField,
  FilterGrid,
  LoadingBlock,
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
import type { ImageStatRow, ImageStatsSummary, Paginated } from "@/app/admin/_lib/types";
import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function ImageStatsPage() {
  const [filters, setFilters] = useState({
    store_hash: "",
    source_type: "",
    status: "",
    date_from: "",
    date_to: "",
  });
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState<ImageStatsSummary | null>(null);
  const [data, setData] = useState<Paginated<ImageStatRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f = filters, p = page) => {
    setLoading(true);
    setError(null);
    const [sumRes, listRes] = await Promise.all([
      adminApi.imageStatsSummary(f),
      adminApi.imageStats({ ...f, page: p, limit: 20 }),
    ]);
    if (sumRes.error && listRes.error) {
      setError(sumRes.error || listRes.error || "Failed to load");
    } else {
      setSummary((sumRes.data as ImageStatsSummary) ?? null);
      setData((listRes.data as Paginated<ImageStatRow>) ?? null);
    }
    setLoading(false);
  }, [filters, page]);

  const debouncedLoad = useMemo(
    () => debounce((f: typeof filters, p: number) => void load(f, p), 400),
    [load],
  );

  useEffect(() => {
    debouncedLoad(filters, page);
    return () => debouncedLoad.cancel();
  }, [filters, page, debouncedLoad]);

  const chartData = summary
    ? [
        { name: "Optimized", value: summary.optimized_images },
        { name: "Failed", value: summary.failed_images },
        { name: "Pending", value: summary.pending_images },
        { name: "Skipped", value: summary.skipped_images },
      ]
    : [];

  const sizeChart = summary
    ? [
        { name: "Original", value: Math.round(summary.total_original_size / 1024 / 1024) },
        { name: "Optimized", value: Math.round(summary.total_optimized_size / 1024 / 1024) },
        { name: "Saved", value: Math.round(summary.total_saved_size / 1024 / 1024) },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Image Optimization Stats"
        action={<RefreshBtn onClick={() => load()} loading={loading} />}
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

      {loading && !summary ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => load()} /> : null}

      {summary ? (
        <>
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
        </>
      ) : null}

      {data ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}
