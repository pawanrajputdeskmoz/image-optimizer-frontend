"use client";

import { CHANNEL_CHANGED_EVENT } from "@/app/_lib/channelStorage";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ExternalLink, Star } from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import AltTextField from "./_components/altTextField";
import CategoryImageListing from "./_components/categoryImageListing";
import HomeImageListing from "./_components/homeImageListing";
import ImageCompareModal from "./_components/imageCompareModal";
import { isApiError, isApiFailure } from "./_lib/apiUtils";
import { buildBulkOptimizeItem, bulkSelectionKey } from "./_lib/bulkSelection";
import {
  bulkOptimizeAllImages,
  bulkOptimizeImages,
  bulkRestoreImages,
  fetchProductList,
  optimizeSingleImage,
  restoreSingleImage,
  updateImageAltText,
} from "./_lib/imageOptimizerApi";
import {
  PLACEHOLDER_IMAGE,
  applyOptimizationResult,
  applyRestoreResult,
  getThumbnailImage,
  isImageOptimized,
  mapApiProduct,
  resolveRestoredAltText,
} from "./_lib/productMappers";
import type {
  ImageActionPayload,
  ImageItem,
  ImageListType,
  Product,
} from "./types";

const LIST_TYPE_OPTIONS: { id: ImageListType; label: string }[] = [
  { id: "product", label: "Product" },
  { id: "categories", label: "Categories" },
  { id: "brand", label: "Brand" },
  { id: "home", label: "Home" },
];

type PreviewTarget = {
  productId: number;
  image: ImageItem;
};

const PRODUCTS_PER_PAGE = 5;

function altTextKey(productId: number, imageId: number) {
  return `${productId}-${imageId}`;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [listType, setListType] = useState<ImageListType>("product");
  const [openProductAccordion, setOpenProductAccordion] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [serverTotalPages, setServerTotalPages] = useState(1);

  const [selectedImages, setSelectedImages] = useState<
    Record<number, ImageItem>
  >({});

  const [optimizingKeys, setOptimizingKeys] = useState<Record<string, true>>(
    {}
  );
  const [restoringKeys, setRestoringKeys] = useState<Record<string, true>>({});

  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(
    null
  );

  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const [savingAltKeys, setSavingAltKeys] = useState<Record<string, true>>({});
  const [bulkSelected, setBulkSelected] = useState<
    Record<string, ImageActionPayload>
  >({});
  const [bulkOptimizePending, setBulkOptimizePending] = useState(false);
  const [bulkOptimizeAllPending, setBulkOptimizeAllPending] = useState(false);
  const [bulkRestorePending, setBulkRestorePending] = useState(false);
  const [allOptimizedAlertOpen, setAllOptimizedAlertOpen] = useState(false);
  const [productsRefreshNonce, setProductsRefreshNonce] = useState(0);

  useEffect(() => {
    const onChannelChanged = () => {
      setListType("product");
      setCurrentPage(1);
      setBulkSelected({});
      setSelectedImages({});
      setOpenProductAccordion([]);
      setProductsRefreshNonce((n) => n + 1);
    };

    window.addEventListener(CHANNEL_CHANGED_EVENT, onChannelChanged);
    return () => {
      window.removeEventListener(CHANNEL_CHANGED_EVENT, onChannelChanged);
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const totalPages = serverTotalPages;

  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const bulkSelectedList = useMemo(
    () => Object.values(bulkSelected),
    [bulkSelected]
  );

  const bulkSelectedCount = bulkSelectedList.length;
  const bulkSelectedOptimizedCount = useMemo(() => {
    if (bulkSelectedList.length === 0) return 0;

    let count = 0;
    for (const item of bulkSelectedList) {
      const product = products.find((p) => p.id === item.product_id);
      const image = product?.images.find((img) => img.id === item.image_id);
      if (image && isImageOptimized(image)) {
        count += 1;
      }
    }
    return count;
  }, [bulkSelectedList, products]);

  const bulkSelectedOptimizedList = useMemo(() => {
    if (bulkSelectedList.length === 0) return [];

    return bulkSelectedList.filter((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const image = product?.images.find((img) => img.id === item.image_id);
      return Boolean(image && isImageOptimized(image));
    });
  }, [bulkSelectedList, products]);

  const bulkSelectedNotOptimizedList = useMemo(() => {
    if (bulkSelectedList.length === 0) return [];

    return bulkSelectedList.filter((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const image = product?.images.find((img) => img.id === item.image_id);
      return Boolean(image && !isImageOptimized(image));
    });
  }, [bulkSelectedList, products]);

  const bulkSelectedNotOptimizedCount = bulkSelectedNotOptimizedList.length;

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const getStoreHash = () => {
    return (
      localStorage.getItem("store_hash") ||
      localStorage.getItem("shop") ||
      ""
    );
  };

  /*
  |--------------------------------------------------------------------------
  | IMAGE ACTIONS
  |--------------------------------------------------------------------------
  */

  const selectImage = useCallback(
    (productId: number, image: ImageItem) => {
      setSelectedImages((prev) => ({
        ...prev,
        [productId]: image,
      }));
    },
    []
  );

  const getDisplayAlt = useCallback(
    (productId: number, image: ImageItem) => {
      const key = altTextKey(productId, image.id);
      return altDrafts[key] ?? image.alt;
    },
    [altDrafts]
  );

  const isAltDirty = useCallback(
    (productId: number, image: ImageItem) =>
      getDisplayAlt(productId, image) !== image.alt,
    [getDisplayAlt]
  );

  const setAltDraft = useCallback(
    (productId: number, imageId: number, value: string) => {
      const key = altTextKey(productId, imageId);
      setAltDrafts((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const patchImageAlt = useCallback(
    (productId: number, imageId: number, alt: string) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id !== productId
            ? p
            : {
              ...p,
              images: p.images.map((img) =>
                img.id === imageId ? { ...img, alt } : img
              ),
            }
        )
      );

      setSelectedImages((prev) => {
        const selected = prev[productId];
        if (!selected || selected.id !== imageId) {
          return prev;
        }
        return {
          ...prev,
          [productId]: { ...selected, alt },
        };
      });
    },
    []
  );

  const saveAltText = useCallback(
    async (product: Product, image: ImageItem) => {
      const key = altTextKey(product.id, image.id);
      const alt = getDisplayAlt(product.id, image);

      setSavingAltKeys((prev) => ({ ...prev, [key]: true }));

      try {
        const response = await updateImageAltText({
          imageId: image.id,
          productId: product.id,
          altText: alt,
        });

        if (isApiError(response)) {
          return;
        }

        if (isApiFailure(response)) {
          toast.error(response.message || "Failed to save alt text");
          return;
        }

        patchImageAlt(product.id, image.id, alt);
        setAltDrafts((prev) => {
          if (!(key in prev)) {
            return prev;
          }
          const next = { ...prev };
          delete next[key];
          return next;
        });
        toast.success("Alt text saved");
      } finally {
        setSavingAltKeys((prev) => {
          if (!prev[key]) {
            return prev;
          }
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [getDisplayAlt, patchImageAlt]
  );

  const toggleBulkSelect = useCallback(
    (productId: number, image: ImageItem, checked: boolean) => {
      const key = bulkSelectionKey(productId, image.id);
      setBulkSelected((prev) => {
        const next = { ...prev };
        if (checked) {
          next[key] = buildBulkOptimizeItem(productId, image);
        } else {
          delete next[key];
        }
        return next;
      });
    },
    []
  );

  const setProductBulkSelectAll = useCallback(
    (product: Product, checked: boolean) => {
      setBulkSelected((prev) => {
        const next = { ...prev };
        for (const image of product.images) {
          if (!image.imageFile) {
            continue;
          }
          const key = bulkSelectionKey(product.id, image.id);
          if (checked) {
            next[key] = buildBulkOptimizeItem(product.id, image);
          } else {
            delete next[key];
          }
        }
        return next;
      });
    },
    []
  );

  const setVisibleBulkSelectAll = useCallback(
    (checked: boolean) => {
      setBulkSelected((prev) => {
        const next = { ...prev };
        for (const product of products) {
          for (const image of product.images) {
            if (!image.imageFile) {
              continue;
            }
            const key = bulkSelectionKey(product.id, image.id);
            if (checked) {
              next[key] = buildBulkOptimizeItem(product.id, image);
            } else {
              delete next[key];
            }
          }
        }
        return next;
      });
    },
    [products]
  );

  const bulkOptimizeSelected = useCallback(async () => {
    if (!bulkSelectedList.length) {
      return;
    }

    const payload = bulkSelectedNotOptimizedList;
    const alreadyOptimizedCount =
      bulkSelectedList.length - payload.length;

    if (!payload.length) {
      setAllOptimizedAlertOpen(true);
      return;
    }

    setBulkOptimizePending(true);

    try {
      const response = await bulkOptimizeImages(payload);

      if (isApiError(response)) {
        return;
      }

      if (isApiFailure(response)) {
        toast.error(response.message || "Bulk optimization failed");
        return;
      }

      const queued = response?.data?.queued ?? payload.length;
      const skippedByApi = response?.data?.skipped ?? 0;
      const skippedTotal = alreadyOptimizedCount + skippedByApi;

      setOptimizingKeys((prev) => {
        const next = { ...prev };
        for (const item of payload) {
          next[`${item.product_id}-${item.image_id}`] = true;
        }
        return next;
      });

      setBulkSelected({});
      toast.success(
        skippedTotal > 0
          ? `${queued} image(s) queued (${skippedTotal} already optimized, skipped)`
          : `${queued} image(s) queued for optimization`
      );
    } finally {
      setBulkOptimizePending(false);
    }
  }, [bulkSelectedList, bulkSelectedNotOptimizedList]);

  const bulkOptimizeAll = useCallback(async () => {
    setBulkOptimizeAllPending(true);

    try {
      const response = await bulkOptimizeAllImages();

      if (isApiError(response)) {
        return;
      }

      if (isApiFailure(response)) {
        toast.error(response.message || "Bulk image optimization failed");
        return;
      }

      const queued = response?.data?.queued;
      const skipped = response?.data?.skipped ?? 0;

      toast.success(
        response.message ||
          (typeof queued === "number"
            ? skipped > 0
              ? `${queued} image(s) queued (${skipped} skipped)`
              : `${queued} image(s) queued for optimization`
            : "All images queued for optimization"),
      );
    } finally {
      setBulkOptimizeAllPending(false);
    }
  }, []);

  const bulkRestoreSelected = useCallback(async () => {
    const payload = bulkSelectedOptimizedList;

    if (!payload.length) {
      return;
    }

    setBulkRestorePending(true);

    setRestoringKeys((prev) => {
      const next = { ...prev };
      for (const item of payload) {
        next[`${item.product_id}-${item.image_id}`] = true;
      }
      return next;
    });

    try {
      const response = await bulkRestoreImages(payload);

      if (isApiError(response)) {
        return;
      }

      if (isApiFailure(response)) {
        toast.error(response.message || "Bulk restore failed");
        return;
      }

      toast.success(response.message || "Images restored");
      setBulkSelected({});
      setProductsRefreshNonce((n) => n + 1);
    } finally {
      setRestoringKeys((prev) => {
        const next = { ...prev };
        for (const item of payload) {
          delete next[`${item.product_id}-${item.image_id}`];
        }
        return next;
      });
      setBulkRestorePending(false);
    }
  }, [bulkSelectedOptimizedList]);

  const optimizeImage = useCallback(
    async (productId: number, image: ImageItem) => {
      const key = `${productId}-${image.id}`;

      setOptimizingKeys((prev) => ({ ...prev, [key]: true }));

      try {
        const response = await optimizeSingleImage(productId, image);

        if (isApiError(response)) {
          return;
        }

        const result = response.data;

        if (response.success !== true || result?.status !== "optimized") {
          return;
        }

        setProducts((prev) =>
          prev.map((p) =>
            p.id !== productId
              ? p
              : {
                ...p,
                images: p.images.map((img) =>
                  applyOptimizationResult(img, image.id, result)
                ),
              }
          )
        );

        setSelectedImages((prev) => {
          const currentImage = prev[productId];
          if (!currentImage) {
            return prev;
          }

          const matchesSelected =
            currentImage.id === image.id ||
            Number(result.old_image_id) === currentImage.id;

          if (!matchesSelected) {
            return prev;
          }

          return {
            ...prev,
            [productId]: applyOptimizationResult(
              currentImage,
              image.id,
              result
            ),
          };
        });

        const newImageId = result.new_image_id ?? image.id;
        setAltDrafts((prev) => {
          const oldKey = altTextKey(productId, image.id);
          const newKey = altTextKey(productId, newImageId);
          const next = { ...prev };
          delete next[oldKey];
          delete next[newKey];
          return next;
        });
      } finally {
        setOptimizingKeys((prev) => {
          if (!prev[key]) {
            return prev;
          }
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    []
  );

  const restoreImage = useCallback(
    async (product: Product, image: ImageItem) => {
      const key = `${product.id}-${image.id}`;

      setRestoringKeys((prev) => ({ ...prev, [key]: true }));

      try {
        const response = await restoreSingleImage(product.id, image);

        if (isApiError(response)) {
          return;
        }

        if (isApiFailure(response)) {
          toast.error(response.message || "Failed to restore image");
          return;
        }

        const result = response?.data;
        if (!result) {
          return;
        }

        setProducts((prev) =>
          prev.map((p) =>
            p.id !== product.id
              ? p
              : {
                ...p,
                images: p.images.map((img) =>
                  applyRestoreResult(img, image.id, result)
                ),
              }
          )
        );

        setSelectedImages((prev) => {
          const current = prev[product.id];
          if (!current) {
            return prev;
          }

          const matches =
            current.id === image.id ||
            Number(result.removed_image_id) === current.id;

          if (!matches) {
            return prev;
          }

          return {
            ...prev,
            [product.id]: applyRestoreResult(current, image.id, result),
          };
        });

        const newImageId = result.restored_image_id ?? image.id;
        const restoredAlt = resolveRestoredAltText(image, result);
        setAltDrafts((prev) => {
          const oldKey = altTextKey(product.id, image.id);
          const newKey = altTextKey(product.id, newImageId);
          const next = { ...prev };
          delete next[oldKey];
          next[newKey] = restoredAlt;
          return next;
        });

        setBulkSelected((prev) => {
          const oldKey = bulkSelectionKey(product.id, image.id);
          const newKey = bulkSelectionKey(product.id, newImageId);
          const next = { ...prev };
          delete next[oldKey];
          delete next[newKey];
          return next;
        });

        toast.success(response.message || "Image restored");
      } finally {
        setRestoringKeys((prev) => {
          if (!prev[key]) {
            return prev;
          }
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | PAGE NAVIGATION
  |--------------------------------------------------------------------------
  */

  const goToPage = (page: number) => {
    const nextPage = Math.min(
      Math.max(1, page),
      totalPages
    );

    setCurrentPage(nextPage);
  };

  const refreshListing = useCallback(() => {
    setProductsRefreshNonce((n) => n + 1);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | DEBOUNCED SEARCH (lodash)
  |--------------------------------------------------------------------------
  */

  const applyDebouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
        setCurrentPage(1);
      }, 500),
    []
  );

  useEffect(() => {
    applyDebouncedSearch(searchInput.trim());
    return () => {
      applyDebouncedSearch.cancel();
    };
  }, [searchInput, applyDebouncedSearch]);

  /*
  |--------------------------------------------------------------------------
  | FETCH PRODUCTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (listType !== "product") {
      return;
    }

    let isCancelled = false;

    const loadProducts = async () => {
      setIsLoadingProducts(true);
      setProductsError(null);

      try {
        const storeHash = getStoreHash();

        if (!storeHash) {
          if (!isCancelled) {
            setProductsError("Store hash not found.");
          }
          return;
        }

        const response = await fetchProductList({
          storeHash,
          page: currentPage,
          limit: PRODUCTS_PER_PAGE,
          search: debouncedSearch,
        });

        if (isCancelled || isApiError(response)) {
          if (!isCancelled && isApiError(response)) {
            setProductsError("Failed to load products.");
          }
          return;
        }

        const apiProducts = Array.isArray(
          response?.data
        )
          ? response.data
          : [];

        const mappedProducts = apiProducts.map((product) =>
          mapApiProduct(product, storeHash)
        );

        setProducts(mappedProducts);

        /*
        |--------------------------------------------------------------------------
        | SET DEFAULT SELECTED IMAGE
        |--------------------------------------------------------------------------
        */

        setSelectedImages((prev) => {
          const updated = { ...prev };

          for (const product of mappedProducts) {
            const thumbnail = getThumbnailImage(product.images);
            if (thumbnail) {
              updated[product.id] = thumbnail;
            }
          }

          return updated;
        });

        /*
        |--------------------------------------------------------------------------
        | SERVER PAGINATION
        |--------------------------------------------------------------------------
        */

        const totalServerPages =
          response?.pagination?.total_pages;

        setServerTotalPages(
          typeof totalServerPages === "number"
            ? totalServerPages
            : 1
        );
      } catch {
        if (!isCancelled) {
          setProductsError("Something went wrong while loading products.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingProducts(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, debouncedSearch, listType, productsRefreshNonce]);

  const handleListTypeChange = useCallback((nextType: ImageListType) => {
    if (nextType === listType) {
      return;
    }
    setListType(nextType);
    setCurrentPage(1);
    setBulkSelected({});
    setSelectedImages({});
    setOpenProductAccordion([]);
  }, [listType]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="rounded-2xl bg-white p-4 shadow-lg">

        {/* HEADER */}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">Image Optimizer</h1>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void bulkOptimizeAll()}
              disabled={bulkOptimizeAllPending}
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkOptimizeAllPending
                ? "Optimizing all…"
                : "Bulk image optimization"}
            </button>

            <button
              type="button"
              onClick={refreshListing}
              disabled={isLoadingProducts}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoadingProducts ? "Refreshing…" : "Refresh"}
            </button>

            {bulkSelectedCount > 0 ? (
              <>
                {bulkSelectedOptimizedCount > 0 ? (
                  <button
                    type="button"
                    disabled={bulkRestorePending}
                    onClick={() => void bulkRestoreSelected()}
                    className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bulkRestorePending
                      ? "Restoring…"
                      : `Restore (${bulkSelectedOptimizedCount})`}
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={bulkOptimizePending}
                  onClick={() => void bulkOptimizeSelected()}
                  className="rounded bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkOptimizePending
                    ? "Optimizing…"
                    : `Optimize (${bulkSelectedNotOptimizedCount > 0 ? bulkSelectedNotOptimizedCount : bulkSelectedCount})`}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* SEARCH */}

        {listType === "product" ? (
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search..."
            className="mb-4 w-full rounded border px-3 py-2 md:w-64"
          />
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2">
          {LIST_TYPE_OPTIONS.map((option) => {
            const isActive = listType === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleListTypeChange(option.id)}
                disabled={listType === "product" && isLoadingProducts && isActive}
                className={`rounded px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive
                    ? "bg-black text-white"
                    : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {listType === "categories" ? (
          <CategoryImageListing refreshNonce={productsRefreshNonce} />
        ) : null}

        {listType === "home" ? (
          <HomeImageListing refreshNonce={productsRefreshNonce} />
        ) : null}

        {listType === "brand" ? (
          <div className="rounded-lg border bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
            Brand image listing coming soon.
          </div>
        ) : null}

        {/* PRODUCTS */}

        {listType === "product" && isLoadingProducts && products.length === 0 ? (
          <div className="flex items-center justify-center gap-3 rounded-lg border bg-gray-50 px-4 py-10 text-sm text-gray-600">
            <span className="inline-block size-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            Loading products…
          </div>
        ) : null}

        {listType === "product" && productsError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {productsError}
          </div>
        ) : null}

        {listType === "product" && isLoadingProducts && products.length > 0 ? (
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-block size-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            Updating…
          </div>
        ) : null}

        {listType === "product" &&
        products.some((p) =>
          p.images.some((img) => Boolean(img.imageFile))
        ) ? (
          <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="size-4 rounded border-gray-300"
              checked={
                products.length > 0 &&
                products.every((product) => {
                  const selectable = product.images.filter((img) =>
                    Boolean(img.imageFile)
                  );
                  return (
                    selectable.length === 0 ||
                    selectable.every((img) =>
                      Boolean(
                        bulkSelected[bulkSelectionKey(product.id, img.id)]
                      )
                    )
                  );
                })
              }
              onChange={(e) => setVisibleBulkSelectAll(e.target.checked)}
            />
            Select all on this page
          </label>
        ) : null}

        {listType === "product" ? (
        <div className="rounded-xl border bg-white">
          <div className="h-[560px] overflow-y-auto p-3">
            <Accordion
              value={openProductAccordion}
              onValueChange={(nextValue) => {
                const last =
                  Array.isArray(nextValue) && nextValue.length
                    ? nextValue[nextValue.length - 1]
                    : undefined;

                setOpenProductAccordion(last ? [last] : []);
              }}
              className="space-y-4"
            >
              {products.map((product) => {
                const selectedImage = selectedImages[product.id];
                const listingImage =
                  getThumbnailImage(product.images) ?? selectedImage;

                return (
                  <AccordionItem key={product.id} value={`product-${product.id}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <Image
                            src={listingImage?.url || PLACEHOLDER_IMAGE}
                            alt={product.name}
                            width={36}
                            height={36}
                            unoptimized
                            className="size-9 rounded object-cover"
                          />
                          {listingImage?.isThumbnail ? (
                            <span
                              className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm"
                              title="Product thumbnail"
                              aria-label="Product thumbnail"
                            >
                              <Star className="size-2.5 fill-current" />
                            </span>
                          ) : null}
                        </div>

                        <p className="flex items-center gap-1.5">
                          <span className="truncate">{product.name}</span>
                          {product.websiteUrl ? (
                            <a
                              href={product.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 text-gray-400 hover:text-gray-700"
                              title="Open product on website"
                              aria-label={`Open ${product.name} on website`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          ) : null}
                        </p>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="space-y-3">
                        {product.images?.some((img) => img.imageFile) ? (
                          <label className="flex cursor-pointer items-center gap-2 px-1 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              className="size-4 rounded border-gray-300"
                              checked={product.images
                                .filter((img) => img.imageFile)
                                .every((img) =>
                                  Boolean(
                                    bulkSelected[
                                    bulkSelectionKey(product.id, img.id)
                                    ]
                                  )
                                )}
                              onChange={(e) =>
                                setProductBulkSelectAll(
                                  product,
                                  e.target.checked
                                )
                              }
                            />
                            Select all images in this product
                          </label>
                        ) : null}

                        {!product.images?.length ? (
                          <div className="rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-600">
                            No images available for this product.
                          </div>
                        ) : null}

                        {product.images?.map((image) => {
                          const isSelected = selectedImage?.id === image.id;
                          const optimized = isImageOptimized(image);
                          const rowKey = `${product.id}-${image.id}`;
                          const isBusy = Boolean(optimizingKeys[rowKey]);
                          const isRestoring = Boolean(restoringKeys[rowKey]);
                          const bulkKey = bulkSelectionKey(
                            product.id,
                            image.id
                          );
                          const isBulkChecked = Boolean(bulkSelected[bulkKey]);
                          const canBulkSelect = Boolean(image.imageFile);

                          return (
                            <div
                              key={image.id}
                              className={`flex items-center gap-4 rounded border p-3 transition-all ${isSelected
                                  ? "border-blue-500 bg-blue-100"
                                  : isBulkChecked
                                    ? "border-gray-400 bg-gray-50"
                                    : "bg-white"
                                }`}
                            >
                              <input
                                type="checkbox"
                                className="size-4 shrink-0 rounded border-gray-300"
                                disabled={!canBulkSelect}
                                checked={isBulkChecked}
                                onChange={(e) =>
                                  toggleBulkSelect(
                                    product.id,
                                    image,
                                    e.target.checked
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Select ${image.fileName}`}
                              />

                              {/* IMAGE */}

                              <div className="relative shrink-0">
                                <Image
                                  src={image.url}
                                  alt={image.alt}
                                  width={56}
                                  height={56}
                                  unoptimized
                                  className="size-14 cursor-pointer rounded object-cover"
                                  onClick={() => selectImage(product.id, image)}
                                />
                                {image.isThumbnail ? (
                                  <span
                                    className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm"
                                    title="Product thumbnail"
                                    aria-label="Product thumbnail"
                                  >
                                    <Star className="size-3 fill-current" />
                                  </span>
                                ) : null}
                              </div>

                              {/* INFO */}

                              <div className="flex-1">
                                <p className="flex items-center gap-1.5 text-sm font-medium">
                                  <span className="truncate">{image.fileName}</span>
                                  {image.url && image.url !== PLACEHOLDER_IMAGE ? (
                                    <a
                                      href={image.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex shrink-0 text-gray-400 hover:text-gray-700"
                                      title="Open image in new tab"
                                      aria-label={`Open ${image.fileName} in new tab`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="size-3.5" />
                                    </a>
                                  ) : null}
                                  <span className="shrink-0 font-normal text-gray-500">
                                    {image.sizeLabel}
                                  </span>
                                </p>

                                <AltTextField
                                  value={getDisplayAlt(product.id, image)}
                                  showSave={isAltDirty(product.id, image)}
                                  disabled={!image.imageFile}
                                  isSaving={Boolean(
                                    savingAltKeys[
                                    altTextKey(product.id, image.id)
                                    ]
                                  )}
                                  onChange={(value) =>
                                    setAltDraft(product.id, image.id, value)
                                  }
                                  onSave={() =>
                                    void saveAltText(product, image)
                                  }
                                />
                              </div>

                              {/* ACTIONS */}

                              <div className="flex gap-2">
                                {optimized ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewTarget({
                                        productId: product.id,
                                        image,
                                      })
                                    }
                                    className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
                                  >
                                    Preview
                                  </button>
                                ) : null}

                                <button
                                  type="button"
                                  disabled={
                                    optimized || isBusy || !image.imageFile
                                  }
                                  onClick={() =>
                                    optimizeImage(product.id, image)
                                  }
                                  className={`rounded px-3 py-2 text-sm text-white disabled:cursor-not-allowed ${optimized
                                      ? "bg-emerald-700 opacity-90"
                                      : "bg-black disabled:opacity-50"
                                    }`}
                                >
                                  {optimized
                                    ? "Optimized"
                                    : isBusy
                                      ? "Optimizing…"
                                      : "Optimize"}
                                </button>

                                {optimized ? (
                                  <button
                                    type="button"
                                    disabled={isRestoring || !image.imageFile}
                                    onClick={() =>
                                      void restoreImage(product, image)
                                    }
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
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
        ) : null}

        {/* PAGINATION */}

        {listType === "product" ? (
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm">
            Page {safeCurrentPage} of{" "}
            {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() =>
                goToPage(safeCurrentPage - 1)
              }
              disabled={safeCurrentPage === 1}
              className="rounded border px-4 py-2 disabled:opacity-50"
            >
              Prev
            </button>

            <button
              onClick={() =>
                goToPage(safeCurrentPage + 1)
              }
              disabled={
                safeCurrentPage === totalPages
              }
              className="rounded border px-4 py-2 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        ) : null}
      </div>

      {previewTarget ? (
        <ImageCompareModal
          open
          onClose={() => setPreviewTarget(null)}
          productId={previewTarget.productId}
          image={previewTarget.image}
        />
      ) : null}

      {allOptimizedAlertOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAllOptimizedAlertOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-optimized-alert-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="all-optimized-alert-title"
              className="text-lg font-semibold text-gray-900"
            >
              Already optimized
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {bulkSelectedCount === 1
                ? "The selected image is already optimized."
                : `All ${bulkSelectedCount} selected images are already optimized.`}{" "}
              Select images that have not been optimized yet, or use Restore
              to revert optimized images.
            </p>
            <button
              type="button"
              onClick={() => setAllOptimizedAlertOpen(false)}
              className="mt-6 w-full rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}