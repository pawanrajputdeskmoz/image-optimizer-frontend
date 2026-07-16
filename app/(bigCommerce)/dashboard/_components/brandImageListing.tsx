"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { isApiError, isApiFailure } from "../_lib/apiUtils";
import {
  applyBrandOptimizationResult,
  applyBrandRestoreResult,
  getBrandOptimizeButtonLabel,
  isBrandOptimizeDisabled,
  mapApiBrands,
} from "../_lib/brandMappers";
import {
  readBrandStoreHash,
  toBrandBulkOptimizeItem,
  toBrandBulkRestoreItem,
} from "../_lib/brandBulk";
import {
  bulkOptimizeBrandImages,
  bulkRestoreBrandImages,
  fetchBrandList,
  optimizeBrandImage,
  restoreBrandImage,
} from "../_lib/imageOptimizerApi";
import type { Brand } from "../types";
import BrandImageCompareModal from "./brandImageCompareModal";
import ListingPagination from "./listingPagination";

const BRAND_PER_PAGE_OPTIONS = [5, 10, 50] as const;

type BrandImageListingProps = {
  refreshNonce?: number;
};

export default function BrandImageListing({
  refreshNonce = 0,
}: BrandImageListingProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(5);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [optimizingIds, setOptimizingIds] = useState<Record<number, true>>({});
  const [restoringIds, setRestoringIds] = useState<Record<number, true>>({});
  const [previewBrand, setPreviewBrand] = useState<Brand | null>(null);
  const [isBulkOptimizing, setIsBulkOptimizing] = useState(false);
  const [isBulkRestoring, setIsBulkRestoring] = useState(false);

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const bulkOptimizeEligible = brands.filter(
    (brand) => brand.hasImage && !brand.isOptimized,
  );
  const bulkRestoreEligible = brands.filter(
    (brand) => brand.isOptimized && brand.hasImage,
  );
  const bulkEligible = brands.filter(
    (brand) =>
      (brand.hasImage && !brand.isOptimized) ||
      (brand.isOptimized && brand.hasImage),
  );
  const allEligibleSelected =
    bulkEligible.length > 0 &&
    bulkEligible.every((brand) => selectedIds.has(brand.id));
  const selectedOptimizeCount = bulkOptimizeEligible.filter((brand) =>
    selectedIds.has(brand.id),
  ).length;
  const selectedRestoreCount = bulkRestoreEligible.filter((brand) =>
    selectedIds.has(brand.id),
  ).length;

  const loadBrands = useCallback(async (page: number, limit: number) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetchBrandList({
        page,
        limit,
      });

      if (isApiError(response)) {
        setError("Failed to load brand images.");
        return;
      }

      if (isApiFailure(response)) {
        setError(response.message || "Failed to load brand images.");
        return;
      }

      setBrands(mapApiBrands(response.data));
      setMessage(response.message ?? null);

      const serverTotalPages = response.pagination?.total_pages;
      setTotalPages(
        typeof serverTotalPages === "number" && serverTotalPages > 0
          ? serverTotalPages
          : 1,
      );
    } catch {
      setError("Something went wrong while loading brand images.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBrands(currentPage, perPage);
  }, [currentPage, perPage, loadBrands, refreshNonce]);

  const handleOptimize = useCallback(async (brand: Brand) => {
    setOptimizingIds((prev) => ({ ...prev, [brand.id]: true }));
    setError(null);

    try {
      const response = await optimizeBrandImage(brand);

      if (isApiError(response)) {
        setError("Failed to optimize brand image.");
        return;
      }

      if (isApiFailure(response)) {
        setError(response.message || "Failed to optimize brand image.");
        return;
      }

      const result = response.data;
      const isOptimized =
        result?.status === "optimized" ||
        result?.status === "uploaded" ||
        result?.optimization_status === "optimized" ||
        Boolean(result?.new_image_url) ||
        Boolean(result?.optimized_url);

      if (response.success !== true || !result || !isOptimized) {
        setError(response.message || "Failed to optimize brand image.");
        return;
      }

      setBrands((prev) =>
        prev.map((item) =>
          item.id === brand.id
            ? applyBrandOptimizationResult(item, result ?? {})
            : item,
        ),
      );
      setMessage(response.message ?? "Brand image optimized successfully.");
      setSelectedIds((prev) => {
        if (!prev.has(brand.id)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(brand.id);
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while optimizing the brand image.",
      );
    } finally {
      setOptimizingIds((prev) => {
        if (!prev[brand.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[brand.id];
        return next;
      });
    }
  }, []);

  const handleRestore = useCallback(async (brand: Brand) => {
    setRestoringIds((prev) => ({ ...prev, [brand.id]: true }));
    setError(null);

    try {
      const response = await restoreBrandImage(brand);

      if (isApiError(response)) {
        setError("Failed to restore brand image.");
        return;
      }

      if (isApiFailure(response)) {
        setError(response.message || "Failed to restore brand image.");
        return;
      }

      if (response.success !== true) {
        setError(response.message || "Failed to restore brand image.");
        return;
      }

      setBrands((prev) =>
        prev.map((item) =>
          item.id === brand.id
            ? applyBrandRestoreResult(item, response.data ?? {})
            : item,
        ),
      );
      setMessage(response.message ?? "Brand image restored successfully.");
      setSelectedIds((prev) => {
        if (!prev.has(brand.id)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(brand.id);
        return next;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while restoring the brand image.",
      );
    } finally {
      setRestoringIds((prev) => {
        if (!prev[brand.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[brand.id];
        return next;
      });
    }
  }, []);

  const handleBulkOptimize = useCallback(async () => {
    const storeHash = readBrandStoreHash();
    if (!storeHash) {
      setError("Store hash not found.");
      return;
    }

    const items = brands
      .filter(
        (brand) =>
          selectedIds.has(brand.id) &&
          brand.hasImage &&
          !brand.isOptimized &&
          brand.imageUrl.trim(),
      )
      .map(toBrandBulkOptimizeItem);

    if (items.length === 0) {
      setError("No eligible brands selected for optimization.");
      return;
    }

    setIsBulkOptimizing(true);
    setError(null);

    try {
      const response = await bulkOptimizeBrandImages(items, storeHash);

      if (isApiError(response)) {
        setError("Bulk optimization failed.");
        return;
      }

      if (isApiFailure(response)) {
        setError(response.message || "Bulk optimization failed.");
        return;
      }

      if (response.success !== true) {
        setError(response.message || "Bulk optimization failed.");
        return;
      }

      const queued = response.data?.queued ?? items.length;
      const skipped = response.data?.skipped ?? 0;
      setMessage(
        response.message ??
          (skipped > 0
            ? `${queued} brand image(s) queued (${skipped} skipped)`
            : `${queued} brand image(s) queued for optimization`),
      );
      setSelectedIds(new Set());
      void loadBrands(currentPage, perPage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during bulk optimization.",
      );
    } finally {
      setIsBulkOptimizing(false);
    }
  }, [brands, selectedIds, currentPage, perPage, loadBrands]);

  const handleBulkRestore = useCallback(async () => {
    const storeHash = readBrandStoreHash();
    if (!storeHash) {
      setError("Store hash not found.");
      return;
    }

    const items = brands
      .filter(
        (brand) =>
          selectedIds.has(brand.id) &&
          brand.isOptimized &&
          brand.hasImage &&
          (brand.optimizedUrl ?? brand.imageUrl).trim(),
      )
      .map(toBrandBulkRestoreItem);

    if (items.length === 0) {
      setError("No optimized brands selected for restore.");
      return;
    }

    setIsBulkRestoring(true);
    setError(null);

    try {
      const response = await bulkRestoreBrandImages(items, storeHash);

      if (isApiError(response)) {
        setError("Bulk restore failed.");
        return;
      }

      if (isApiFailure(response)) {
        setError(response.message || "Bulk restore failed.");
        return;
      }

      if (response.success !== true) {
        setError(response.message || "Bulk restore failed.");
        return;
      }

      const queued = response.data?.queued ?? items.length;
      const skipped = response.data?.skipped ?? 0;
      setMessage(
        response.message ??
          (skipped > 0
            ? `${queued} brand image(s) queued for restore (${skipped} skipped)`
            : `${queued} brand image(s) queued for restore`),
      );
      setSelectedIds(new Set());
      void loadBrands(currentPage, perPage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during bulk restore.",
      );
    } finally {
      setIsBulkRestoring(false);
    }
  }, [brands, selectedIds, currentPage, perPage, loadBrands]);

  const handlePerPageChange = useCallback((nextPerPage: number) => {
    setPerPage(nextPerPage);
    setCurrentPage(1);
  }, []);

  if (isLoading && brands.length === 0) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border bg-gray-50 px-4 py-10 text-sm text-gray-600">
        <span className="inline-block size-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        Loading brand images...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading && brands.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block size-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          Updating...
        </div>
      ) : null}

      {message && !error ? <p className="text-sm text-gray-600">{message}</p> : null}

      <div className="rounded-xl border bg-white">
        {bulkEligible.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                checked={allEligibleSelected}
                onChange={(e) =>
                  setSelectedIds(
                    e.target.checked
                      ? new Set(bulkEligible.map((brand) => brand.id))
                      : new Set(),
                  )
                }
                className="size-4 cursor-pointer accent-black"
              />
              Select all eligible ({bulkEligible.length})
            </label>

            {selectedIds.size > 0 ? (
              <div className="ml-auto flex gap-2">
                {selectedOptimizeCount > 0 ? (
                  <button
                    type="button"
                    disabled={isBulkOptimizing}
                    onClick={() => void handleBulkOptimize()}
                    className="rounded bg-black px-4 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBulkOptimizing
                      ? "Optimizing…"
                      : `Optimize (${selectedOptimizeCount})`}
                  </button>
                ) : null}

                {selectedRestoreCount > 0 ? (
                  <button
                    type="button"
                    disabled={isBulkRestoring}
                    onClick={() => void handleBulkRestore()}
                    className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBulkRestoring
                      ? "Restoring…"
                      : `Restore (${selectedRestoreCount})`}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="h-[560px] overflow-y-auto p-3">
          {brands.length === 0 && !isLoading ? (
            <div className="rounded-lg border bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
              No brand images found.
            </div>
          ) : (
            <div className="space-y-3">
              {brands.map((brand) => {
                const isOptimized = brand.isOptimized;
                const isBusy = Boolean(optimizingIds[brand.id]);
                const isRestoring = Boolean(restoringIds[brand.id]);
                const isOptimizeDisabled =
                  isBusy ||
                  !brand.hasImage ||
                  isBrandOptimizeDisabled(brand.optimizationStatus);
                const optimizeButtonLabel = !brand.hasImage
                  ? "No Image"
                  : getBrandOptimizeButtonLabel(
                      brand.optimizationStatus,
                      isBusy,
                    );
                const displayImageUrl = brand.optimizedUrl ?? brand.imageUrl;

                return (
                  <div
                    key={brand.id}
                    className="flex items-center gap-4 rounded border bg-white p-3"
                  >
                    {brand.hasImage ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(brand.id)}
                        onChange={(e) =>
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) {
                              next.add(brand.id);
                            } else {
                              next.delete(brand.id);
                            }
                            return next;
                          })
                        }
                        className="size-4 shrink-0 cursor-pointer accent-black"
                        aria-label={`Select ${brand.name}`}
                      />
                    ) : null}

                    <Image
                      src={displayImageUrl}
                      alt={brand.name}
                      width={56}
                      height={56}
                      unoptimized
                      className="size-14 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{brand.name}</span>
                        {brand.storefrontUrl ? (
                          <a
                            href={brand.storefrontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 text-gray-400 hover:text-gray-700"
                            title="Open brand page"
                            aria-label={`Open ${brand.name} brand page`}
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        ) : null}
                        <span className="shrink-0 font-normal text-gray-500">
                          {brand.sizeLabel}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {brand.name} · Brand image
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {isOptimized ? (
                        <button
                          type="button"
                          onClick={() => setPreviewBrand(brand)}
                          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          Preview
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={isOptimizeDisabled}
                        onClick={() => void handleOptimize(brand)}
                        className={`rounded px-3 py-2 text-sm text-white disabled:cursor-not-allowed ${
                          !brand.hasImage
                            ? "bg-gray-400 opacity-80"
                            : isOptimized
                              ? "bg-emerald-700 opacity-90"
                              : "bg-black disabled:opacity-50"
                        }`}
                      >
                        {optimizeButtonLabel}
                      </button>

                      {isOptimized ? (
                        <button
                          type="button"
                          disabled={isRestoring}
                          onClick={() => void handleRestore(brand)}
                          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRestoring ? "Restoring…" : "Restore"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BrandImageCompareModal
        open={previewBrand !== null}
        brand={previewBrand}
        onClose={() => setPreviewBrand(null)}
      />

      <ListingPagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        disabled={isLoading}
        perPage={perPage}
        perPageOptions={[...BRAND_PER_PAGE_OPTIONS]}
        onPerPageChange={handlePerPageChange}
        perPageLabel="Items per page"
      />
    </div>
  );
}
