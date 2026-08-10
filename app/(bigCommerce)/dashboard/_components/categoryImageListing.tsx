"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isApiError, isApiFailure } from "../_lib/apiUtils";
import {
  applyCategoryOptimizationResult,
  findCategoryByContextualImage,
  mapApiCategories,
  mapCategoryToContextualImage,
} from "../_lib/categoryMappers";
import { formatBytesToKb } from "../_lib/productMappers";
import {
  bulkOptimizeCategoryImages,
  bulkRestoreCategoryImages,
  fetchCategoryList,
  optimizeCategoryImage,
  restoreCategoryImage,
} from "../_lib/imageOptimizerApi";
import type { Category, CategoryBulkOptimizeItem, ContextualImage } from "../types";
import CategoryImageCompareModal from "./categoryImageCompareModal";
import ListingPagination from "./listingPagination";
import ContextualImageRow from "./contextualImageRow";

const CATEGORY_PER_PAGE_OPTIONS = [5, 10, 50] as const;

export type CategoryBulkActionsState = {
  selectedCount: number;
  selectedOptimizeCount: number;
  selectedRestoreCount: number;
  isBulkOptimizing: boolean;
  isBulkRestoring: boolean;
};

type CategoryImageListingProps = {
  refreshNonce?: number;
  /** Silent background refresh (active job polling) — no listing skeleton. */
  pollNonce?: number;
  headerSelectAllChecked?: boolean;
  headerSelectAllSignal?: number;
  onHeaderSelectAllStateChange?: (state: {
    checked: boolean;
    visible: boolean;
    disabled: boolean;
  }) => void;
  onBulkActionsStateChange?: (state: CategoryBulkActionsState) => void;
  bulkActionsRef?: React.MutableRefObject<{
    optimize: () => void;
    restore: () => void;
  } | null>;
  /** Notify parent that a category job was queued so stats/polling can start. */
  onJobQueued?: () => void;
};

function readStoreHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    localStorage.getItem("store_hash")?.trim() ||
    localStorage.getItem("shop")?.trim() ||
    ""
  );
}

export default function CategoryImageListing({
  refreshNonce = 0,
  pollNonce = 0,
  headerSelectAllChecked = false,
  headerSelectAllSignal = 0,
  onHeaderSelectAllStateChange,
  onBulkActionsStateChange,
  bulkActionsRef,
  onJobQueued,
}: CategoryImageListingProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(50);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [previewCategory, setPreviewCategory] = useState<Category | null>(
    null,
  );
  const [optimizingKeys, setOptimizingKeys] = useState<Record<string, true>>({});
  const [restoringKeys, setRestoringKeys] = useState<Record<string, true>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkOptimizing, setIsBulkOptimizing] = useState(false);
  const [isBulkRestoring, setIsBulkRestoring] = useState(false);
  const hasLoadedRef = useRef(false);
  const pollNonceRef = useRef(pollNonce);

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const loadCategories = useCallback(
    async (page: number, limit: number, options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      if (!silent) {
        setIsLoading(true);
        setError(null);
        setMessage(null);
      }

      try {
        const storeHash = readStoreHash();
        if (!storeHash) {
          if (!silent) {
            setError("Store hash not found.");
          }
          return;
        }

        const response = await fetchCategoryList({
          storeHash,
          page,
          limit,
        });

        if (isApiError(response)) {
          if (!silent) {
            setError("Failed to load category images.");
          }
          return;
        }

        if (isApiFailure(response)) {
          if (!silent) {
            setError(response.message || "Failed to load category images.");
          }
          return;
        }

        setCategories(mapApiCategories(response.data));
        if (!silent) {
          setMessage(response.message ?? null);
        }
        hasLoadedRef.current = true;

        const serverTotalPages = response.pagination?.total_pages;
        setTotalPages(
          typeof serverTotalPages === "number" && serverTotalPages > 0
            ? serverTotalPages
            : 1,
        );
      } catch {
        if (!silent) {
          setError("Something went wrong while loading category images.");
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    // Initial load, page/per-page change, or manual refresh → listing skeleton.
    void loadCategories(currentPage, perPage, { silent: false });
  }, [loadCategories, currentPage, perPage, refreshNonce]);

  useEffect(() => {
    // Active-job poll bumps only — keep rows visible (like product silent refresh).
    if (pollNonceRef.current === pollNonce) {
      return;
    }
    pollNonceRef.current = pollNonce;
    if (!hasLoadedRef.current) {
      return;
    }
    void loadCategories(currentPage, perPage, { silent: true });
  }, [loadCategories, currentPage, perPage, pollNonce]);

  const handlePreview = useCallback(
    (image: ContextualImage) => {
      const category = findCategoryByContextualImage(categories, image);
      if (category) {
        setPreviewCategory(category);
      }
    },
    [categories],
  );

  const handleOptimize = useCallback(
    async (image: ContextualImage) => {
      const category = findCategoryByContextualImage(categories, image);
      if (!category) {
        setError("Category not found.");
        return;
      }

      setOptimizingKeys((prev) => ({ ...prev, [image.key]: true }));
      setError(null);

      try {
        const response = await optimizeCategoryImage(category);

        if (isApiError(response)) {
          setError("Failed to optimize category image.");
          return;
        }

        if (isApiFailure(response)) {
          setError(response.message || "Failed to optimize category image.");
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
          setError(response.message || "Failed to optimize category image.");
          return;
        }

        setCategories((prev) =>
          prev.map((item) =>
            item.id === category.id
              ? applyCategoryOptimizationResult(item, result ?? {})
              : item,
          ),
        );
        setMessage(response.message ?? "Category image optimized successfully.");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while optimizing the category image.",
        );
      } finally {
        setOptimizingKeys((prev) => {
          if (!prev[image.key]) {
            return prev;
          }

          const next = { ...prev };
          delete next[image.key];
          return next;
        });
      }
    },
    [categories],
  );

  const handleRestore = useCallback(
    async (image: ContextualImage) => {
      const category = findCategoryByContextualImage(categories, image);
      if (!category) {
        setError("Category not found.");
        return;
      }

      setRestoringKeys((prev) => ({ ...prev, [image.key]: true }));
      setError(null);

      try {
        const response = await restoreCategoryImage(category);

        if (isApiError(response)) {
          setError("Failed to restore category image.");
          return;
        }

        if (isApiFailure(response)) {
          setError(response.message || "Failed to restore category image.");
          return;
        }

        if (response.success !== true) {
          setError(response.message || "Failed to restore category image.");
          return;
        }

        const d = response.data;
        const restoredUrl =
          d?.restored_image_url ?? d?.original_url ?? category.imageUrl;

        const restoredSizeLabel =
          typeof d?.original_size === "number" && Number.isFinite(d.original_size)
            ? formatBytesToKb(d.original_size)
            : category.sizeLabel;

        setCategories((prev) =>
          prev.map((item) =>
            item.id === category.id
              ? {
                  ...item,
                  imageUrl: restoredUrl,
                  optimizedUrl: null,
                  sizeLabel: restoredSizeLabel,
                  optimizedSizeLabel: "—",
                  status: "pending",
                  optimizationStatus: "pending",
                  isOptimized: false,
                  canOptimize: true,
                }
              : item,
          ),
        );
        setMessage(response.message ?? "Category image restored successfully.");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while restoring the category image.",
        );
      } finally {
        setRestoringKeys((prev) => {
          if (!prev[image.key]) return prev;
          const next = { ...prev };
          delete next[image.key];
          return next;
        });
      }
    },
    [categories],
  );

  // Eligible for bulk optimize: has image, not yet optimized
  const bulkOptimizeEligible = categories.filter(
    (c) => c.canOptimize && c.hasImage && !c.isOptimized,
  );
  // Eligible for bulk restore: already optimized
  const bulkRestoreEligible = categories.filter(
    (c) => c.isOptimized && c.hasImage,
  );
  // "Select all" covers the union of both sets
  const bulkEligible = categories.filter(
    (c) => (c.canOptimize && c.hasImage && !c.isOptimized) || (c.isOptimized && c.hasImage),
  );
  const allEligibleSelected =
    bulkEligible.length > 0 &&
    bulkEligible.every((c) => selectedIds.has(c.id));

  // From selected rows, how many qualify for each action
  const selectedOptimizeCount = bulkOptimizeEligible.filter((c) =>
    selectedIds.has(c.id),
  ).length;
  const selectedRestoreCount = bulkRestoreEligible.filter((c) =>
    selectedIds.has(c.id),
  ).length;

  const handleSelectRow = useCallback(
    (image: ContextualImage, checked: boolean) => {
      const id = Number(image.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    [],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(
        checked
          ? new Set(
              categories
                .filter(
                  (c) =>
                    (c.canOptimize && c.hasImage && !c.isOptimized) ||
                    (c.isOptimized && c.hasImage),
                )
                .map((c) => c.id),
            )
          : new Set(),
      );
    },
    [categories],
  );

  useEffect(() => {
    onHeaderSelectAllStateChange?.({
      checked: allEligibleSelected,
      visible: true,
      disabled: bulkEligible.length === 0,
    });
  }, [
    allEligibleSelected,
    bulkEligible.length,
    onHeaderSelectAllStateChange,
  ]);

  useEffect(() => {
    handleSelectAll(headerSelectAllChecked);
  }, [headerSelectAllChecked, headerSelectAllSignal, handleSelectAll]);

  const handleBulkOptimize = useCallback(async () => {
    // Build payload: only selected categories that have an image and are not yet optimized
    const items: CategoryBulkOptimizeItem[] = categories
      .filter(
        (c) =>
          selectedIds.has(c.id) &&
          c.canOptimize &&
          c.hasImage &&
          !c.isOptimized &&
          c.imageUrl.trim(),
      )
      .map((c) => ({
        category_id: c.id,
        image_url: c.imageUrl,
        category_name: c.name,
        tree_id: c.treeId,
      }));

    if (items.length === 0) {
      setError("No eligible categories selected for optimization.");
      return;
    }

    setIsBulkOptimizing(true);
    setError(null);

    try {
      const response = await bulkOptimizeCategoryImages(items);

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

      setMessage(
        response.message ??
          `${items.length} categor${items.length === 1 ? "y" : "ies"} queued for optimization.`,
      );
      setSelectedIds(new Set());
      onJobQueued?.();

      // Reload the page to reflect updated statuses from the server
      void loadCategories(currentPage, perPage, { silent: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during bulk optimization.",
      );
    } finally {
      setIsBulkOptimizing(false);
    }
  }, [categories, selectedIds, currentPage, perPage, loadCategories, onJobQueued]);

  const handleBulkRestore = useCallback(async () => {
    // Only send categories that are selected AND already optimized (have an optimized image)
    const items: CategoryBulkOptimizeItem[] = categories
      .filter(
        (c) =>
          selectedIds.has(c.id) &&
          c.isOptimized &&
          c.imageUrl.trim(),
      )
      .map((c) => ({
        category_id: c.id,
        image_url: c.optimizedUrl ?? c.imageUrl,
        category_name: c.name,
        tree_id: c.treeId,
      }));

    if (items.length === 0) {
      setError("No optimized categories selected for restore.");
      return;
    }

    setIsBulkRestoring(true);
    setError(null);

    try {
      const response = await bulkRestoreCategoryImages(items);

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

      const queued = response.data?.queued_categories ?? items.length;
      setMessage(
        response.message ??
          `${queued} categor${queued === 1 ? "y" : "ies"} queued for restore.`,
      );
      setSelectedIds(new Set());
      onJobQueued?.();
      void loadCategories(currentPage, perPage, { silent: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during bulk restore.",
      );
    } finally {
      setIsBulkRestoring(false);
    }
  }, [categories, selectedIds, currentPage, perPage, loadCategories, onJobQueued]);

  useEffect(() => {
    onBulkActionsStateChange?.({
      selectedCount: selectedIds.size,
      selectedOptimizeCount,
      selectedRestoreCount,
      isBulkOptimizing,
      isBulkRestoring,
    });
  }, [
    selectedIds.size,
    selectedOptimizeCount,
    selectedRestoreCount,
    isBulkOptimizing,
    isBulkRestoring,
    onBulkActionsStateChange,
  ]);

  useEffect(() => {
    if (!bulkActionsRef) {
      return undefined;
    }

    bulkActionsRef.current = {
      optimize: () => void handleBulkOptimize(),
      restore: () => void handleBulkRestore(),
    };

    return () => {
      bulkActionsRef.current = null;
    };
  }, [bulkActionsRef, handleBulkOptimize, handleBulkRestore]);

  const goToPage = useCallback((page: number) => {
    setSelectedIds(new Set());
    setCurrentPage(Math.max(1, page));
  }, []);

  const handlePerPageChange = useCallback((nextPerPage: number) => {
    setSelectedIds(new Set());
    setPerPage(nextPerPage);
    setCurrentPage(1);
  }, []);

  const rows = categories.map((category) => ({
    image: mapCategoryToContextualImage(category),
    canOptimize: category.canOptimize,
    hasImage: category.hasImage,
    // Eligible for any bulk action: can optimize OR can restore
    isEligibleForBulk:
      (category.canOptimize && category.hasImage && !category.isOptimized) ||
      (category.isOptimized && category.hasImage),
  }));

  return (
    <div className="space-y-3">
      {error && !isLoading ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message && !error && !isLoading ? (
        <p className="text-sm text-gray-600">{message}</p>
      ) : null}

      <div className="rounded-xl border bg-white">
        <div className="h-[520px] overflow-y-auto p-3">
          {isLoading ? (
            <div
              className="space-y-3"
              aria-busy="true"
              aria-label="Loading category images"
            >
              {Array.from({ length: Math.min(perPage, 10) }, (_, index) => (
                <div
                  key={`category-skeleton-${index}`}
                  className="flex items-center gap-3 rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-[#F8FAFC] p-3"
                >
                  <div className="size-4 shrink-0 animate-pulse rounded bg-gray-200" />
                  <div className="size-10 shrink-0 animate-pulse rounded bg-gray-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3.5 w-2/5 max-w-[220px] animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-1/4 max-w-[120px] animate-pulse rounded bg-gray-100" />
                  </div>
                  <div className="ml-auto hidden items-center gap-2 sm:flex">
                    <div className="h-7 w-16 animate-pulse rounded-lg bg-gray-200" />
                    <div className="h-7 w-16 animate-pulse rounded-lg bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
              No category images found.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(({ image, hasImage, isEligibleForBulk }) => (
                <ContextualImageRow
                  key={image.key}
                  image={image}
                  isSelected={selectedIds.has(Number(image.id))}
                  isBusy={Boolean(optimizingKeys[image.key])}
                  isRestoring={Boolean(restoringKeys[image.key])}
                  onSelect={isEligibleForBulk ? handleSelectRow : undefined}
                  onOptimize={
                    hasImage && !image.isOptimized ? handleOptimize : undefined
                  }
                  onRestore={image.isOptimized ? handleRestore : undefined}
                  onPreview={image.isOptimized ? handlePreview : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ListingPagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        disabled={isLoading}
        perPage={perPage}
        perPageOptions={[...CATEGORY_PER_PAGE_OPTIONS]}
        onPerPageChange={handlePerPageChange}
        perPageLabel="Items per page"
      />

      <CategoryImageCompareModal
        open={previewCategory !== null}
        category={previewCategory}
        onClose={() => setPreviewCategory(null)}
      />
    </div>
  );
}
