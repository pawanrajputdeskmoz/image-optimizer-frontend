"use client";

import { useCallback, useEffect, useState } from "react";

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
  fetchCategoryList,
  optimizeCategoryImage,
  restoreCategoryImage,
} from "../_lib/imageOptimizerApi";
import type { Category, CategoryBulkOptimizeItem, ContextualImage } from "../types";
import CategoryImageCompareModal from "./categoryImageCompareModal";
import ContextualImageRow from "./contextualImageRow";

const CATEGORIES_PER_PAGE = 50;

type CategoryImageListingProps = {
  refreshNonce?: number;
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
}: CategoryImageListingProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
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

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const loadCategories = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const storeHash = readStoreHash();
      if (!storeHash) {
        setError("Store hash not found.");
        return;
      }

      const response = await fetchCategoryList({
        storeHash,
        page,
        limit: CATEGORIES_PER_PAGE,
      });

      if (isApiError(response)) {
        setError("Failed to load category images.");
        return;
      }

      if (isApiFailure(response)) {
        setError(response.message || "Failed to load category images.");
        return;
      }

      setCategories(mapApiCategories(response.data));
      setMessage(response.message ?? null);

      const serverTotalPages = response.pagination?.total_pages;
      setTotalPages(
        typeof serverTotalPages === "number" && serverTotalPages > 0
          ? serverTotalPages
          : 1,
      );
    } catch {
      setError("Something went wrong while loading category images.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories(currentPage);
  }, [loadCategories, currentPage, refreshNonce]);

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

  // A category is eligible for bulk optimize if it has an image and is not yet optimized
  const bulkEligible = categories.filter(
    (c) => c.canOptimize && c.hasImage && !c.isOptimized,
  );
  const allEligibleSelected =
    bulkEligible.length > 0 &&
    bulkEligible.every((c) => selectedIds.has(c.id));

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
        checked ? new Set(bulkEligible.map((c) => c.id)) : new Set(),
      );
    },
    [bulkEligible],
  );

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

      // Reload the page to reflect updated statuses from the server
      void loadCategories(currentPage);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during bulk optimization.",
      );
    } finally {
      setIsBulkOptimizing(false);
    }
  }, [categories, selectedIds, currentPage, loadCategories]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const rows = categories.map((category) => ({
    image: mapCategoryToContextualImage(category),
    canOptimize: category.canOptimize,
    isEligibleForBulk: category.canOptimize && category.hasImage && !category.isOptimized,
  }));

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border bg-gray-50 px-4 py-10 text-sm text-gray-600">
        <span className="inline-block size-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        Loading category images…
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

      {isLoading && categories.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block size-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          Updating…
        </div>
      ) : null}

      {message && !error ? (
        <p className="text-sm text-gray-600">{message}</p>
      ) : null}

      <div className="rounded-xl border bg-white">
        {/* Bulk-action toolbar */}
        {bulkEligible.length > 0 ? (
          <div className="flex items-center gap-3 border-b px-4 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                checked={allEligibleSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="size-4 cursor-pointer accent-black"
              />
              Select all eligible ({bulkEligible.length})
            </label>

            {selectedIds.size > 0 ? (
              <button
                type="button"
                disabled={isBulkOptimizing}
                onClick={handleBulkOptimize}
                className="ml-auto rounded bg-black px-4 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBulkOptimizing
                  ? "Optimizing…"
                  : `Optimize selected (${selectedIds.size})`}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="h-[520px] overflow-y-auto p-3">
          {rows.length === 0 && !isLoading ? (
            <div className="rounded-lg border bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
              No category images found.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(({ image, canOptimize, isEligibleForBulk }) => (
                <ContextualImageRow
                  key={image.key}
                  image={image}
                  isSelected={selectedIds.has(Number(image.id))}
                  isBusy={Boolean(optimizingKeys[image.key])}
                  isRestoring={Boolean(restoringKeys[image.key])}
                  onSelect={isEligibleForBulk ? handleSelectRow : undefined}
                  onOptimize={canOptimize ? handleOptimize : undefined}
                  onRestore={image.isOptimized ? handleRestore : undefined}
                  onPreview={image.isOptimized ? handlePreview : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Page {safeCurrentPage} of {totalPages}
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => goToPage(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1 || isLoading}
            className="rounded border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>

          <button
            type="button"
            onClick={() => goToPage(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages || isLoading}
            className="rounded border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <CategoryImageCompareModal
        open={previewCategory !== null}
        category={previewCategory}
        onClose={() => setPreviewCategory(null)}
      />
    </div>
  );
}
