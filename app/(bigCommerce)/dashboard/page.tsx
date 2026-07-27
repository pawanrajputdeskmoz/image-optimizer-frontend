"use client";

import { CHANNEL_CHANGED_EVENT } from "@/app/_lib/channelStorage";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowUpDown,
  Eye,
  Loader2,
  RotateCw,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import AltTextField from "./_components/altTextField";
import BrandImageListing from "./_components/brandImageListing";
import CategoryImageListing from "./_components/categoryImageListing";
import DashboardStatsCards from "./_components/dashboardStatsCards";
import ImageCompareModal from "./_components/imageCompareModal";
import ListingPagination from "./_components/listingPagination";
import OptimizationSettingsDialog from "./_components/optimizationSettingsDialog";
import ImageOptimizerAppHeader from "@/app/_components/imageOptimizerAppHeader";
import { isApiError, isApiFailure, notifyApiBusinessFailure } from "./_lib/apiUtils";
import { buildBulkOptimizeItem, bulkSelectionKey } from "./_lib/bulkSelection";
import {
  bulkOptimizeAllBrands,
  bulkOptimizeAllCategories,
  bulkOptimizeAllImages,
  bulkOptimizeImages,
  bulkRestoreAllBrands,
  bulkRestoreAllCategories,
  bulkRestoreAllImages,
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
  { id: "product", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "brand", label: "Brand" },
];

type PreviewTarget = {
  productId: number;
  image: ImageItem;
};

const PRODUCT_PER_PAGE_OPTIONS = [5, 10] as const;

function altTextKey(productId: number, imageId: number) {
  return `${productId}-${imageId}`;
}

function ButtonLoader({ label }: { label: string }) {
  return (
    <>
      <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
      <span>{label}</span>
    </>
  );
}

function imageActionKey(productId: number, imageId: number) {
  return `${productId}-${imageId}`;
}

function markPayloadKeys(
  prev: Record<string, true>,
  payload: Array<{ product_id: number; image_id: number }>
) {
  const next = { ...prev };
  for (const item of payload) {
    next[imageActionKey(item.product_id, item.image_id)] = true;
  }
  return next;
}

function clearPayloadKeys(
  prev: Record<string, true>,
  payload: Array<{ product_id: number; image_id: number }>
) {
  const next = { ...prev };
  for (const item of payload) {
    delete next[imageActionKey(item.product_id, item.image_id)];
  }
  return next;
}

function productHasMissingAlt(product: Product) {
  return product.images.some((img) => Boolean(img.imageFile) && !img.alt?.trim());
}

function productSelectableImages(product: Product) {
  return product.images.filter((img) => Boolean(img.imageFile));
}

function productAllOptimized(product: Product) {
  const selectable = productSelectableImages(product);
  return (
    selectable.length > 0 && selectable.every((img) => isImageOptimized(img))
  );
}

function productAnyOptimized(product: Product) {
  return productSelectableImages(product).some((img) => isImageOptimized(img));
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
  const [productsPerPage, setProductsPerPage] = useState<number>(5);
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
  const [bulkRestoreAllPending, setBulkRestoreAllPending] = useState(false);
  const [bulkRestorePending, setBulkRestorePending] = useState(false);
  const [allOptimizedAlertOpen, setAllOptimizedAlertOpen] = useState(false);
  const [productsRefreshNonce, setProductsRefreshNonce] = useState(0);
  const [listingPollNonce, setListingPollNonce] = useState(0);
  const [activeJob, setActiveJob] = useState(false);
  const [quotaUsed, setQuotaUsed] = useState<number | null>(null);
  const [quotaLimit, setQuotaLimit] = useState<number | null>(null);
  const [pendingRestoreCount, setPendingRestoreCount] = useState(0);
  const [activeBulkRestore, setActiveBulkRestore] = useState(false);
  const [contextualHeaderSelectAllChecked, setContextualHeaderSelectAllChecked] =
    useState(false);
  const [contextualHeaderSelectAllVisible, setContextualHeaderSelectAllVisible] =
    useState(false);
  const [contextualHeaderSelectAllDisabled, setContextualHeaderSelectAllDisabled] =
    useState(true);
  const [contextualHeaderSelectAllSignal, setContextualHeaderSelectAllSignal] =
    useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [productActionPending, setProductActionPending] = useState<
    Record<string, true>
  >({});
  const [saveAltBulkPending, setSaveAltBulkPending] = useState(false);
  const silentListingRefreshRef = useRef(false);
  const wasActiveJobRef = useRef(false);
  const awaitingRestoreJobRef = useRef(false);
  const wasActiveRestoreRef = useRef(false);
  const restoreRequestedAtRef = useRef(0);

  const listingRefreshKey = productsRefreshNonce + listingPollNonce;

  useEffect(() => {
    const onChannelChanged = () => {
      setListType("product");
      setCurrentPage(1);
      setBulkSelected({});
      setSelectedImages({});
      setOpenProductAccordion([]);
      setContextualHeaderSelectAllChecked(false);
      setContextualHeaderSelectAllVisible(false);
      setContextualHeaderSelectAllDisabled(true);
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

  const clearQueuedActionLoaders = useCallback(() => {
    setOptimizingKeys({});
    setRestoringKeys({});
    setProductActionPending({});
    setBulkOptimizePending(false);
    setBulkOptimizeAllPending(false);
    setBulkRestorePending(false);
    setBulkRestoreAllPending(false);
    awaitingRestoreJobRef.current = false;
    wasActiveRestoreRef.current = false;
  }, []);

  const clearRestoreActionLoaders = useCallback(() => {
    setRestoringKeys({});
    setProductActionPending((prev) => {
      const keys = Object.keys(prev).filter((key) => key.startsWith("res-"));
      if (!keys.length) return prev;
      const next = { ...prev };
      for (const key of keys) delete next[key];
      return next;
    });
    setBulkRestorePending(false);
    setBulkRestoreAllPending(false);
    awaitingRestoreJobRef.current = false;
  }, []);

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

    const productIds = [
      ...new Set(payload.map((item) => Number(item.product_id))),
    ];

    setBulkOptimizePending(true);
    setOptimizingKeys((prev) => markPayloadKeys(prev, payload));
    setProductActionPending((prev) => {
      const next = { ...prev };
      for (const productId of productIds) {
        next[`opt-${productId}`] = true;
      }
      return next;
    });

    const clearSelectedOptimizeLoaders = () => {
      setOptimizingKeys((prev) => clearPayloadKeys(prev, payload));
      setProductActionPending((prev) => {
        const next = { ...prev };
        for (const productId of productIds) {
          delete next[`opt-${productId}`];
        }
        return next;
      });
      setBulkOptimizePending(false);
    };

    try {
      const response = await bulkOptimizeImages(payload);

      if (isApiError(response) || isApiFailure(response)) {
        clearSelectedOptimizeLoaders();
        if (isApiFailure(response)) {
          toast.error(response.message || "Bulk optimization failed");
        }
        return;
      }

      const queued = response?.data?.queued ?? payload.length;
      const skippedByApi = response?.data?.skipped ?? 0;
      const skippedTotal = alreadyOptimizedCount + skippedByApi;

      setBulkSelected({});
      setProductsRefreshNonce((n) => n + 1);
      toast.success(
        skippedTotal > 0
          ? `${queued} image(s) queued (${skippedTotal} already optimized, skipped)`
          : `${queued} image(s) queued for optimization`
      );

      if (queued <= 0) {
        clearSelectedOptimizeLoaders();
      }
      // else keep loaders only for selected products until active_job finishes
    } catch {
      clearSelectedOptimizeLoaders();
    }
  }, [bulkSelectedList, bulkSelectedNotOptimizedList]);

  const bulkOptimizeAll = useCallback(async () => {
    setBulkOptimizeAllPending(true);

    try {
      if (listType === "product") {
        const response = await bulkOptimizeAllImages();
        if (notifyApiBusinessFailure(response, "Product image optimization failed")) {
          setBulkOptimizeAllPending(false);
          return;
        }
        const queued = response?.data?.queued;
        const skipped = response?.data?.skipped ?? 0;
        setOptimizingKeys((prev) => {
          const next = { ...prev };
          for (const product of products) {
            for (const image of productSelectableImages(product)) {
              if (!isImageOptimized(image)) {
                next[imageActionKey(product.id, image.id)] = true;
              }
            }
          }
          return next;
        });
        setProductsRefreshNonce((n) => n + 1);
        toast.success(
          response.message ||
          (typeof queued === "number"
            ? skipped > 0
              ? `${queued} product image(s) queued (${skipped} skipped)`
              : `${queued} product image(s) queued for optimization`
            : "All product images queued for optimization"),
        );
        if (typeof queued === "number" && queued <= 0) {
          setBulkOptimizeAllPending(false);
          setOptimizingKeys({});
        }
        return;
      }

      if (listType === "categories") {
        const response = await bulkOptimizeAllCategories();
        if (notifyApiBusinessFailure(response, "Category image optimization failed")) {
          setBulkOptimizeAllPending(false);
          return;
        }
        const queued = response?.data?.queued;
        const skipped = response?.data?.skipped ?? 0;
        setProductsRefreshNonce((n) => n + 1);
        toast.success(
          response.message ||
          (typeof queued === "number"
            ? skipped > 0
              ? `${queued} category image(s) queued (${skipped} skipped)`
              : `${queued} category image(s) queued for optimization`
            : "All category images queued for optimization"),
        );
        if (typeof queued === "number" && queued <= 0) {
          setBulkOptimizeAllPending(false);
        }
        return;
      }

      const response = await bulkOptimizeAllBrands();
      if (notifyApiBusinessFailure(response, "Brand image optimization failed")) {
        setBulkOptimizeAllPending(false);
        return;
      }
      const queued = response?.data?.queued;
      const skipped = response?.data?.skipped ?? 0;
      setProductsRefreshNonce((n) => n + 1);
      toast.success(
        response.message ||
        (typeof queued === "number"
          ? skipped > 0
            ? `${queued} brand image(s) queued (${skipped} skipped)`
            : `${queued} brand image(s) queued for optimization`
          : "All brand images queued for optimization"),
      );
      if (typeof queued === "number" && queued <= 0) {
        setBulkOptimizeAllPending(false);
      }
    } catch {
      setBulkOptimizeAllPending(false);
    }
  }, [listType, products]);

  const handleBulkRestoreAll = useCallback(async () => {
    setBulkRestoreAllPending(true);
    awaitingRestoreJobRef.current = true;
    restoreRequestedAtRef.current = Date.now();

    try {
      if (listType === "product") {
        const response = await bulkRestoreAllImages();

        if (isApiError(response) || isApiFailure(response)) {
          clearRestoreActionLoaders();
          if (isApiFailure(response)) {
            toast.error(response.message || "Product image restore failed");
          }
          return;
        }

        const queued = response?.data?.queued;
        const skipped = response?.data?.skipped ?? 0;
        setProductsRefreshNonce((n) => n + 1);

        // No images queued (or API returned an idle success) — clear immediately.
        if (typeof queued === "number" && queued <= 0) {
          clearRestoreActionLoaders();
          toast.message(
            response.message || "No optimized images available to restore",
          );
          return;
        }

        toast.success(
          response.message ||
          (typeof queued === "number"
            ? skipped > 0
              ? `${queued} product image(s) queued for restore (${skipped} skipped)`
              : `${queued} product image(s) queued for restore`
            : "All product images queued for restore"),
        );
        // Keep loaders until dashboard-stats confirms restore is idle again.
        return;
      }

      if (listType === "categories") {
        const response = await bulkRestoreAllCategories();

        if (isApiError(response) || isApiFailure(response)) {
          clearRestoreActionLoaders();
          if (isApiFailure(response)) {
            toast.error(response.message || "Category image restore failed");
          }
          return;
        }

        const queued = response?.data?.queued;
        const skipped = response?.data?.skipped ?? 0;
        setProductsRefreshNonce((n) => n + 1);
        if (typeof queued === "number" && queued <= 0) {
          clearRestoreActionLoaders();
          toast.message(
            response.message || "No optimized category images available to restore",
          );
          return;
        }
        toast.success(
          response.message ||
          (typeof queued === "number"
            ? skipped > 0
              ? `${queued} category image(s) queued for restore (${skipped} skipped)`
              : `${queued} category image(s) queued for restore`
            : "All category images queued for restore"),
        );
        return;
      }

      const response = await bulkRestoreAllBrands();

      if (isApiError(response) || isApiFailure(response)) {
        clearRestoreActionLoaders();
        if (isApiFailure(response)) {
          toast.error(response.message || "Brand image restore failed");
        }
        return;
      }

      const queued = response?.data?.queued;
      const skipped = response?.data?.skipped ?? 0;
      setProductsRefreshNonce((n) => n + 1);
      if (typeof queued === "number" && queued <= 0) {
        clearRestoreActionLoaders();
        toast.message(
          response.message || "No optimized brand images available to restore",
        );
        return;
      }
      toast.success(
        response.message ||
        (typeof queued === "number"
          ? skipped > 0
            ? `${queued} brand image(s) queued for restore (${skipped} skipped)`
            : `${queued} brand image(s) queued for restore`
          : "All brand images queued for restore"),
      );
    } catch {
      clearRestoreActionLoaders();
    }
  }, [listType, clearRestoreActionLoaders]);

  // Safety: if Restore All never becomes an active job (nothing to restore),
  // clear the stuck Restoring / Pending Restore UI after a short wait.
  useEffect(() => {
    if (!bulkRestoreAllPending) return undefined;

    const timeout = window.setTimeout(() => {
      if (
        awaitingRestoreJobRef.current &&
        !wasActiveRestoreRef.current &&
        Date.now() - restoreRequestedAtRef.current >= 2500
      ) {
        clearRestoreActionLoaders();
        toast.message("No optimized images available to restore");
      }
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [bulkRestoreAllPending, clearRestoreActionLoaders]);

  const bulkRestoreSelected = useCallback(async () => {
    const payload = bulkSelectedOptimizedList;

    if (!payload.length) {
      return;
    }

    const productIds = [
      ...new Set(payload.map((item) => Number(item.product_id))),
    ];

    setBulkRestorePending(true);
    setRestoringKeys((prev) => markPayloadKeys(prev, payload));
    setProductActionPending((prev) => {
      const next = { ...prev };
      for (const productId of productIds) {
        next[`res-${productId}`] = true;
      }
      return next;
    });

    const clearSelectedRestoreLoaders = () => {
      setRestoringKeys((prev) => clearPayloadKeys(prev, payload));
      setProductActionPending((prev) => {
        const next = { ...prev };
        for (const productId of productIds) {
          delete next[`res-${productId}`];
        }
        return next;
      });
      setBulkRestorePending(false);
    };

    try {
      const response = await bulkRestoreImages(payload);

      if (isApiError(response) || isApiFailure(response)) {
        clearSelectedRestoreLoaders();
        if (isApiFailure(response)) {
          toast.error(response.message || "Bulk restore failed");
        }
        return;
      }

      toast.success(response.message || "Images restored");
      setBulkSelected({});
      setProductsRefreshNonce((n) => n + 1);

      const queued = response?.data?.queued;
      if (typeof queued === "number" && queued <= 0) {
        clearSelectedRestoreLoaders();
      }
      // else keep loaders only for selected products until active_job finishes
    } catch {
      clearSelectedRestoreLoaders();
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

        if (response.skipped === true || result?.status === "skipped") {
          toast.message(
            result?.skip_reason ||
            response.message ||
            "Image is already queued for optimization.",
          );
          return;
        }

        if (response.success !== true || result?.status !== "optimized") {
          if (response.message) {
            toast.error(response.message);
          }
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

  const dirtyAltCount = useMemo(() => {
    let count = 0;
    for (const product of products) {
      for (const image of product.images) {
        if (isAltDirty(product.id, image)) count += 1;
      }
    }
    return count;
  }, [products, isAltDirty]);

  const saveAllDirtyAltText = useCallback(async () => {
    const dirty: { product: Product; image: ImageItem }[] = [];
    for (const product of products) {
      for (const image of product.images) {
        if (isAltDirty(product.id, image)) {
          dirty.push({ product, image });
        }
      }
    }
    if (!dirty.length) {
      toast.message("No alt text changes to save");
      return;
    }

    setSaveAltBulkPending(true);
    try {
      for (const item of dirty) {
        await saveAltText(item.product, item.image);
      }
    } finally {
      setSaveAltBulkPending(false);
    }
  }, [products, isAltDirty, saveAltText]);

  const optimizeAllForProduct = useCallback(
    async (product: Product) => {
      const payload = productSelectableImages(product)
        .filter((img) => !isImageOptimized(img))
        .map((img) => buildBulkOptimizeItem(product.id, img));

      if (!payload.length) {
        toast.message("All images in this product are already optimized");
        return;
      }

      const key = `opt-${product.id}`;
      setProductActionPending((prev) => ({ ...prev, [key]: true }));
      setOptimizingKeys((prev) => markPayloadKeys(prev, payload));

      try {
        const response = await bulkOptimizeImages(payload);
        if (isApiError(response) || isApiFailure(response)) {
          setProductActionPending((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          setOptimizingKeys((prev) => clearPayloadKeys(prev, payload));
          if (isApiFailure(response)) {
            toast.error(response.message || "Failed to optimize product images");
          }
          return;
        }
        toast.success(response.message || "Product images queued for optimization");
        refreshListing();

        const queued = response?.data?.queued;
        if (typeof queued === "number" && queued <= 0) {
          setProductActionPending((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          setOptimizingKeys((prev) => clearPayloadKeys(prev, payload));
        }
        // else keep loaders until active_job finishes
      } catch {
        setProductActionPending((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setOptimizingKeys((prev) => clearPayloadKeys(prev, payload));
      }
    },
    [refreshListing],
  );

  const restoreAllForProduct = useCallback(
    async (product: Product) => {
      const payload = productSelectableImages(product)
        .filter((img) => isImageOptimized(img))
        .map((img) => buildBulkOptimizeItem(product.id, img));

      if (!payload.length) {
        toast.message("No optimized images to restore in this product");
        return;
      }

      const key = `res-${product.id}`;
      setProductActionPending((prev) => ({ ...prev, [key]: true }));
      setRestoringKeys((prev) => markPayloadKeys(prev, payload));

      try {
        const response = await bulkRestoreImages(payload);
        if (isApiError(response) || isApiFailure(response)) {
          setProductActionPending((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          setRestoringKeys((prev) => clearPayloadKeys(prev, payload));
          if (isApiFailure(response)) {
            toast.error(response.message || "Failed to restore product images");
          }
          return;
        }
        toast.success(response.message || "Product images queued for restore");
        refreshListing();

        const queued = response?.data?.queued;
        if (typeof queued === "number" && queued <= 0) {
          setProductActionPending((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          setRestoringKeys((prev) => clearPayloadKeys(prev, payload));
        }
        // else keep loaders until active_job finishes
      } catch {
        setProductActionPending((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setRestoringKeys((prev) => clearPayloadKeys(prev, payload));
      }
    },
    [refreshListing],
  );

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
    const silent = silentListingRefreshRef.current;
    silentListingRefreshRef.current = false;

    const loadProducts = async () => {
      if (!silent) {
        setIsLoadingProducts(true);
        setProductsError(null);
      }

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
          limit: productsPerPage,
          search: debouncedSearch,
        });

        if (isCancelled || isApiError(response)) {
          if (!isCancelled && isApiError(response) && !silent) {
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

        // Drop loaders for images whose status already updated in listing.
        setRestoringKeys((prev) => {
          const keys = Object.keys(prev);
          if (!keys.length) return prev;
          const next = { ...prev };
          let changed = false;
          for (const key of keys) {
            const [productId, imageId] = key.split("-").map(Number);
            const product = mappedProducts.find((p) => p.id === productId);
            const image = product?.images.find((img) => img.id === imageId);
            if (!image || !isImageOptimized(image)) {
              delete next[key];
              changed = true;
            }
          }
          return changed ? next : prev;
        });

        setOptimizingKeys((prev) => {
          const keys = Object.keys(prev);
          if (!keys.length) return prev;
          const next = { ...prev };
          let changed = false;
          for (const key of keys) {
            const [productId, imageId] = key.split("-").map(Number);
            const product = mappedProducts.find((p) => p.id === productId);
            const image = product?.images.find((img) => img.id === imageId);
            if (!image || isImageOptimized(image)) {
              delete next[key];
              changed = true;
            }
          }
          return changed ? next : prev;
        });

        setProductActionPending((prev) => {
          const keys = Object.keys(prev);
          if (!keys.length) return prev;
          const next = { ...prev };
          let changed = false;
          for (const key of keys) {
            const productId = Number(key.slice(4));
            const product = mappedProducts.find((p) => p.id === productId);
            if (!product) {
              delete next[key];
              changed = true;
              continue;
            }
            if (key.startsWith("res-")) {
              const anyOptimized = productSelectableImages(product).some((img) =>
                isImageOptimized(img)
              );
              if (!anyOptimized) {
                delete next[key];
                changed = true;
              }
            }
            if (key.startsWith("opt-")) {
              const anyPending = productSelectableImages(product).some(
                (img) => !isImageOptimized(img)
              );
              if (!anyPending) {
                delete next[key];
                changed = true;
              }
            }
          }
          return changed ? next : prev;
        });

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
        if (!isCancelled && !silent) {
          setProductsError("Something went wrong while loading products.");
        }
      } finally {
        if (!isCancelled && !silent) {
          setIsLoadingProducts(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, debouncedSearch, listType, productsPerPage, listingRefreshKey]);

  const handleProductsPerPageChange = useCallback((nextPerPage: number) => {
    setProductsPerPage(nextPerPage);
    setCurrentPage(1);
  }, []);

  const handleListTypeChange = useCallback((nextType: ImageListType) => {
    if (nextType === listType) {
      return;
    }
    setListType(nextType);
    setCurrentPage(1);
    setBulkSelected({});
    setSelectedImages({});
    setOpenProductAccordion([]);
    setContextualHeaderSelectAllChecked(false);
    setContextualHeaderSelectAllVisible(false);
    setContextualHeaderSelectAllDisabled(true);
  }, [listType]);

  const handleContextualHeaderSelectAllStateChange = useCallback(
    ({
      checked,
      visible,
      disabled,
    }: {
      checked: boolean;
      visible: boolean;
      disabled: boolean;
    }) => {
      setContextualHeaderSelectAllChecked(checked);
      setContextualHeaderSelectAllVisible(visible);
      setContextualHeaderSelectAllDisabled(disabled);
    },
    []
  );

  const optimizeAllLabel =
    listType === "categories"
      ? "Optimize All Categories"
      : listType === "brand"
        ? "Optimize All Brands"
        : "Optimize All Products";

  const restoreAllLabel =
    listType === "categories"
      ? "Restore All Categories"
      : listType === "brand"
        ? "Restore All Brands"
        : "Restore All Products";

  const handleStatsChange = useCallback(
    (
      stats: {
        image_quota: { used: number; limit: number | null };
        active_job?: boolean;
        pending_mode?: "optimize" | "restore";
        pending_restore_images?: { value?: number };
        active_bulk_restores?: {
          product?: boolean;
          category?: boolean;
          brand?: boolean;
        };
      } | null
    ) => {
      if (!stats) {
        setQuotaUsed(null);
        setQuotaLimit(null);
        setActiveJob(false);
        setPendingRestoreCount(0);
        setActiveBulkRestore(false);
        return;
      }

      const restoreCount =
        typeof stats.pending_restore_images?.value === "number"
          ? stats.pending_restore_images.value
          : 0;
      const restores = stats.active_bulk_restores;
      const bulkRestoreActive = Boolean(
        restores?.product || restores?.category || restores?.brand
      );
      const restoreActive =
        stats.active_job === true ||
        bulkRestoreActive ||
        restoreCount > 0;

      setQuotaUsed(stats.image_quota.used);
      setQuotaLimit(stats.image_quota.limit);
      setActiveJob(stats.active_job === true);
      setPendingRestoreCount(restoreCount);
      setActiveBulkRestore(bulkRestoreActive);

      if (restoreActive) {
        wasActiveRestoreRef.current = true;
        awaitingRestoreJobRef.current = false;
        return;
      }

      // Restore finished, or Restore All found nothing to queue.
      const waitedLongEnough =
        Date.now() - restoreRequestedAtRef.current >= 2000;
      if (
        wasActiveRestoreRef.current ||
        (awaitingRestoreJobRef.current && waitedLongEnough)
      ) {
        wasActiveRestoreRef.current = false;
        clearRestoreActionLoaders();
      }
    },
    [clearRestoreActionLoaders]
  );

  const isRestoreRunning =
    pendingRestoreCount > 0 ||
    activeBulkRestore ||
    bulkRestoreAllPending ||
    bulkRestorePending ||
    Object.keys(restoringKeys).length > 0 ||
    Object.keys(productActionPending).some((key) => key.startsWith("res-"));

  // While a bulk job is running, silently poll the listing (same cadence as stats).
  // When the job finishes (active_job true → false), do one final silent refresh
  // and clear queued action loaders.
  useEffect(() => {
    const bumpSilentListing = () => {
      silentListingRefreshRef.current = true;
      setListingPollNonce((n) => n + 1);
    };

    if (activeJob) {
      wasActiveJobRef.current = true;
      const interval = window.setInterval(bumpSilentListing, 10000);
      return () => window.clearInterval(interval);
    }

    if (wasActiveJobRef.current) {
      wasActiveJobRef.current = false;
      bumpSilentListing();
      clearQueuedActionLoaders();
    }

    return undefined;
  }, [activeJob, clearQueuedActionLoaders]);

  return (
    <div>
      <ImageOptimizerAppHeader
        title="Image Optimizer"
        subtitle="Faster pages with optimized images & alt text"
        quotaUsed={quotaUsed}
        quotaLimit={quotaLimit}
      />

      <DashboardStatsCards
        refreshNonce={productsRefreshNonce}
        onStatsChange={handleStatsChange}
      />

      <div className="card mb-0!">
        {/* HEADER */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-[#303030] mb-0">
              Product Image Optimization
            </h2>
            <p className="text-xs text-[#616161] font-normal mb-0">
              Optimize images and alt text based on your settings. Restore anytime
              within 30 days.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isRestoreRunning ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[11px] font-semibold text-[#D97706]">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                {pendingRestoreCount > 0
                  ? `Pending Restore: ${pendingRestoreCount}`
                  : "Pending Restore"}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => void bulkOptimizeAll()}
              disabled={bulkOptimizeAllPending}
              className="btn-default disabled:bg-[#F0F0F0] disabled:text-[#8A8A8A] disabled:shadow-none"
            >
              {bulkOptimizeAllPending ? (
                <ButtonLoader label="Optimizing…" />
              ) : (
                optimizeAllLabel
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleBulkRestoreAll()}
              disabled={bulkRestoreAllPending}
              className="btn-default"
            >
              {bulkRestoreAllPending ? (
                <ButtonLoader label="Restoring…" />
              ) : (
                restoreAllLabel
              )}
            </button>

            <OptimizationSettingsDialog />

            {bulkSelectedCount > 0 ? (
              <>
                {bulkSelectedOptimizedCount > 0 ? (
                  <button
                    type="button"
                    disabled={bulkRestorePending}
                    onClick={() => void bulkRestoreSelected()}
                    className="btn-default"
                  >
                    {bulkRestorePending ? (
                      <ButtonLoader label="Restoring…" />
                    ) : (
                      `Restore (${bulkSelectedOptimizedCount})`
                    )}
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={bulkOptimizePending}
                  onClick={() => void bulkOptimizeSelected()}
                  className="custom-btn"
                >
                  {bulkOptimizePending ? (
                    <ButtonLoader label="Optimizing…" />
                  ) : (
                    `Optimize (${bulkSelectedNotOptimizedCount > 0 ? bulkSelectedNotOptimizedCount : bulkSelectedCount})`
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* TABS + TOOLS */}
        <div className="card shadow-none! mb-2! p-2! flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {listType === "product" ? (
              <input
                type="checkbox"
                className="size-4 rounded border-gray-300 ml-1.5 mr-1.5"
                aria-label="Select all products on this page"
                checked={
                  products.length > 0 &&
                  products.every((product) => {
                    const selectable = productSelectableImages(product);
                    return (
                      selectable.length === 0 ||
                      selectable.every((img) =>
                        Boolean(
                          bulkSelected[bulkSelectionKey(product.id, img.id)],
                        ),
                      )
                    );
                  })
                }
                onChange={(e) => setVisibleBulkSelectAll(e.target.checked)}
              />
            ) : contextualHeaderSelectAllVisible ? (
              <input
                type="checkbox"
                className="size-4 rounded border-gray-300 ml-1.5 mr-1.5"
                aria-label={`Select all ${listType} on this page`}
                checked={contextualHeaderSelectAllChecked}
                disabled={contextualHeaderSelectAllDisabled}
                onChange={(e) => {
                  setContextualHeaderSelectAllChecked(e.target.checked);
                  setContextualHeaderSelectAllSignal((n) => n + 1);
                }}
              />
            ) : null}

            {LIST_TYPE_OPTIONS.map((option) => {
              const isActive = listType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleListTypeChange(option.id)}
                  disabled={
                    listType === "product" && isLoadingProducts && isActive
                  }
                  className={`rounded-[8px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#EBEBEB] text-[#303030]"
                      : "bg-transparent text-[#303030] hover:bg-[#EBEBEB] cursor-pointer"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {listType === "product" ? (
              <button
                type="button"
                onClick={() => void saveAllDirtyAltText()}
                disabled={saveAltBulkPending || dirtyAltCount === 0}
                className="custom-btn"
              >
                {saveAltBulkPending
                  ? "Saving…"
                  : dirtyAltCount > 0
                    ? `Save Alt Text (${dirtyAltCount})`
                    : "Save Alt Text"}
              </button>
            ) : null}

            {listType === "product" ? (
              <button
                type="button"
                onClick={() => setShowSearch((v) => !v)}
                className={`inline-flex cursor-pointer size-7 items-center justify-center rounded-lg border border-[#D1D1D1] bg-white text-[#303030] hover:bg-[#FAFAFA] ${
                  showSearch ? "border-[#3F3F3F]" : ""
                }`}
                aria-label="Toggle search"
                title="Search"
              >
                <Search className="size-4" />
              </button>
            ) : null}

            <button
              type="button"
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-[#D1D1D1] bg-white text-[#303030] hover:bg-[#FAFAFA]"
              aria-label="Sort"
              title="Sort"
            >
              <ArrowUpDown className="size-4" />
            </button>

            <button
              type="button"
              onClick={refreshListing}
              disabled={isLoadingProducts}
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-[#D1D1D1] bg-white text-[#303030] hover:bg-[#FAFAFA] disabled:opacity-50"
              aria-label="Refresh"
              title="Refresh"
            >
              <RotateCw
                className={`size-4 ${isLoadingProducts ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {listType === "product" && showSearch ? (
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="io-input mb-4 w-full md:w-72"
            autoFocus
          />
        ) : null}

        {listType === "categories" ? (
          <CategoryImageListing
            refreshNonce={listingRefreshKey}
            headerSelectAllChecked={contextualHeaderSelectAllChecked}
            headerSelectAllSignal={contextualHeaderSelectAllSignal}
            onHeaderSelectAllStateChange={handleContextualHeaderSelectAllStateChange}
          />
        ) : null}

        {listType === "brand" ? (
          <BrandImageListing
            refreshNonce={listingRefreshKey}
            headerSelectAllChecked={contextualHeaderSelectAllChecked}
            headerSelectAllSignal={contextualHeaderSelectAllSignal}
            onHeaderSelectAllStateChange={handleContextualHeaderSelectAllStateChange}
          />
        ) : null}

        {/* PRODUCTS */}

        {listType === "product" && isLoadingProducts ? (
          <div className="rounded-xl border bg-white">
            <div className="flex items-center justify-center gap-3 px-4 py-10 text-sm text-[#616161]">
              <span className="inline-block size-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              Loading products...
            </div>
          </div>
        ) : null}

        {listType === "product" && productsError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {productsError}
          </div>
        ) : null}

        {listType === "product" && !isLoadingProducts ? (
          <div className="space-y-2">
            <Accordion
              value={openProductAccordion}
              onValueChange={(nextValue) => {
                const last =
                  Array.isArray(nextValue) && nextValue.length
                    ? nextValue[nextValue.length - 1]
                    : undefined;

                setOpenProductAccordion(last ? [last] : []);
              }}
              className="gap-2"
            >
              {products.map((product) => {
                const selectedImage = selectedImages[product.id];
                const listingImage =
                  getThumbnailImage(product.images) ?? selectedImage;
                const imageCount = product.images?.length ?? 0;
                const missingAlt = productHasMissingAlt(product);
                const allOptimized = productAllOptimized(product);
                const anyOptimized = productAnyOptimized(product);
                const optPending = Boolean(
                  productActionPending[`opt-${product.id}`] ||
                    bulkOptimizeAllPending,
                );
                const resPending = Boolean(
                  productActionPending[`res-${product.id}`] ||
                    bulkRestoreAllPending,
                );
                const productSelected =
                  productSelectableImages(product).length > 0 &&
                  productSelectableImages(product).every((img) =>
                    Boolean(bulkSelected[bulkSelectionKey(product.id, img.id)]),
                  );

                return (
                  <AccordionItem
                    key={product.id}
                    value={`product-${product.id}`}
                    className="card mb-0! bg-[#F8FAFC]! shadow-none! p-3!"
                  >
                    <AccordionTrigger className="items-center gap-3 border-0 p-0 shadow-none hover:no-underline **:data-[slot=accordion-trigger-icon]:ml-0 **:data-[slot=accordion-trigger-icon]:size-7 **:data-[slot=accordion-trigger-icon]:rounded-[8px] **:data-[slot=accordion-trigger-icon]:border **:data-[slot=accordion-trigger-icon]:border-[#D1D1D1] **:data-[slot=accordion-trigger-icon]:bg-white **:data-[slot=accordion-trigger-icon]:p-1.5 **:data-[slot=accordion-trigger-icon]:text-[#303030]">
                      <div className="flex flex-1 items-center gap-3 overflow-hidden">
                        <input
                          type="checkbox"
                          className="size-4 shrink-0 rounded border-gray-300"
                          checked={productSelected}
                          disabled={productSelectableImages(product).length === 0}
                          onChange={(e) =>
                            setProductBulkSelectAll(product, e.target.checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${product.name}`}
                        />

                        <div className="relative shrink-0">
                          <Image
                            src={listingImage?.url || PLACEHOLDER_IMAGE}
                            alt={product.name}
                            width={40}
                            height={40}
                            unoptimized
                            className="size-10 rounded object-cover"
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

                        <div className="overflow-hidden">
                          <p className="mb-0 flex items-center gap-1.5 text-sm font-medium text-[#303030]">
                            <span
                              className="truncate max-w-[180px] sm:max-w-[260px] md:max-w-[340px] lg:max-w-[420px] text-[13px] font-medium text-[#303030]"
                              title={product.name}
                            >
                              {product.name}
                            </span>
                            {product.websiteUrl ? (
                              <a
                                href={product.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 text-[#9A9A9A] hover:text-[#303030]"
                                title="Open product on website"
                                aria-label={`Open ${product.name} on website`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Image
                                  src="/images/link-icon.svg"
                                  alt=""
                                  width={14}
                                  height={14}
                                  unoptimized
                                  className="size-3.5"
                                />
                              </a>
                            ) : null}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex rounded-[8px] bg-[#E0F0FF] px-2 py-0.5 text-xs font-medium text-[#00527C]">
                              Total Images: {imageCount}
                            </span>
                            {missingAlt ? (
                              <span className="inline-flex rounded-[8px] bg-[#FFEF9D] px-2 py-0.5 text-xs font-medium text-[#4F4700]">
                                Alt Text Not Available
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div
                        className="ml-2 flex shrink-0 items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {anyOptimized ? (
                          <button
                            type="button"
                            disabled={resPending}
                            onClick={() => void restoreAllForProduct(product)}
                            className="btn-default"
                          >
                            {resPending ? (
                              <ButtonLoader label="Restoring…" />
                            ) : (
                              "Restore All"
                            )}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          disabled={optPending || allOptimized || imageCount === 0}
                          onClick={() => void optimizeAllForProduct(product)}
                          className="btn-default"
                        >
                          {optPending ? (
                            <ButtonLoader label="Optimizing…" />
                          ) : allOptimized ? (
                            "Optimized"
                          ) : (
                            "Optimize All Images"
                          )}
                        </button>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="pt-3 pb-1">
                        {!product.images?.length ? (
                          <div className="rounded-lg border border-[#EBEBEB] bg-[#FAFAFA] px-4 py-3 text-sm text-[#616161]">
                            No images available for this product.
                          </div>
                        ) : (
                          <div className="io-image-table custom-table overflow-x-auto">
                            <table className="table w-full table-fixed border-collapse text-left text-[13px]">
                              <thead>
                                <tr>
                                  <th className="w-10 px-3 py-2.5">
                                    <input
                                      type="checkbox"
                                      className="size-4 rounded border-gray-300"
                                      aria-label="Select all images in this product"
                                      checked={
                                        product.images
                                          .filter((img) => img.imageFile)
                                          .every((img) =>
                                            Boolean(
                                              bulkSelected[
                                                bulkSelectionKey(
                                                  product.id,
                                                  img.id,
                                                )
                                              ],
                                            ),
                                          ) &&
                                        product.images.some((img) =>
                                          Boolean(img.imageFile),
                                        )
                                      }
                                      onChange={(e) =>
                                        setProductBulkSelectAll(
                                          product,
                                          e.target.checked,
                                        )
                                      }
                                    />
                                  </th>
                                  <th className="w-[42%] px-3 py-2.5 font-semibold text-[#303030]">
                                    Image
                                  </th>
                                  <th className="px-3 py-2.5 font-semibold text-[#303030]">
                                    Alt Text
                                  </th>
                                  <th className="px-3 py-2.5 font-semibold text-[#303030]">
                                    Status
                                  </th>
                                  <th className="px-3 py-2.5 font-semibold text-[#303030]">
                                    Size saved
                                  </th>
                                  <th className="px-3 py-2.5 font-semibold text-[#303030]">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.images.map((image) => {
                                  const optimized = isImageOptimized(image);
                                  const rowKey = `${product.id}-${image.id}`;
                                  const isBusy = Boolean(
                                    optimizingKeys[rowKey] ||
                                      (optPending && !optimized),
                                  );
                                  const isRestoring = Boolean(
                                    restoringKeys[rowKey] ||
                                      (resPending && optimized),
                                  );
                                  const bulkKey = bulkSelectionKey(
                                    product.id,
                                    image.id,
                                  );
                                  const isBulkChecked = Boolean(
                                    bulkSelected[bulkKey],
                                  );
                                  const canBulkSelect = Boolean(
                                    image.imageFile,
                                  );
                                  const savedLabel =
                                    optimized &&
                                    typeof image.savedPercent === "number"
                                      ? `${image.savedPercent.toFixed(2)}%`
                                      : null;

                                  return (
                                    <tr
                                      key={image.id}
                                      className={`border-t border-[#EBEBEB] ${
                                        isBulkChecked ? "bg-[#FAFAFA]" : "bg-white"
                                      }`}
                                    >
                                      <td className="px-3 py-3 align-middle">
                                        <input
                                          type="checkbox"
                                          className="size-4 rounded border-gray-300"
                                          disabled={!canBulkSelect}
                                          checked={isBulkChecked}
                                          onChange={(e) =>
                                            toggleBulkSelect(
                                              product.id,
                                              image,
                                              e.target.checked,
                                            )
                                          }
                                          aria-label={`Select ${image.fileName}`}
                                        />
                                      </td>

                                      <td className="px-3 py-3 align-middle">
                                        <div className="flex min-w-0 items-center gap-3">
                                          <div className="relative shrink-0">
                                            <Image
                                              src={image.url}
                                              alt={image.alt}
                                              width={40}
                                              height={40}
                                              unoptimized
                                              className="size-10 cursor-pointer rounded object-cover"
                                              onClick={() =>
                                                selectImage(product.id, image)
                                              }
                                            />
                                            {image.isThumbnail ? (
                                              <span
                                                className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm"
                                                title="Product thumbnail"
                                              >
                                                <Star className="size-2.5 fill-current" />
                                              </span>
                                            ) : null}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="mb-0! truncate text-[13px] font-medium text-[#303030]">
                                              {image.fileName}
                                            </p>
                                            <span className="mt-1 inline-flex rounded-full bg-[#F1F1F1] px-2 py-0.5 text-[11px] font-medium text-[#616161]">
                                              {image.sizeLabel || "—"}
                                            </span>
                                          </div>
                                        </div>
                                      </td>

                                      <td className="min-w-[220px] px-3 py-3 align-middle">
                                        <AltTextField
                                          value={getDisplayAlt(
                                            product.id,
                                            image,
                                          )}
                                          showSave={isAltDirty(
                                            product.id,
                                            image,
                                          )}
                                          disabled={!image.imageFile}
                                          isSaving={Boolean(
                                            savingAltKeys[
                                              altTextKey(product.id, image.id)
                                            ],
                                          )}
                                          onChange={(value) =>
                                            setAltDraft(
                                              product.id,
                                              image.id,
                                              value,
                                            )
                                          }
                                          onSave={() =>
                                            void saveAltText(product, image)
                                          }
                                        />
                                      </td>

                                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                                        {optimized ? (
                                          <span className="inline-flex rounded-full bg-[#E3FBE7] px-2.5 py-1 text-[11px] font-medium text-[#0B7A2B]">
                                            Optimized
                                          </span>
                                        ) : (
                                          <span className="inline-flex rounded-full bg-[#F1F1F1] px-2.5 py-1 text-[11px] font-medium text-[#616161]">
                                            Not Optimized
                                          </span>
                                        )}
                                      </td>

                                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                                        {savedLabel ? (
                                          <span className="inline-flex rounded-full bg-[#E3FBE7] px-2.5 py-1 text-[11px] font-medium text-[#0B7A2B]">
                                            {savedLabel}
                                          </span>
                                        ) : (
                                          <span className="text-[#9A9A9A]">
                                            ---
                                          </span>
                                        )}
                                      </td>

                                      <td className="px-3 py-3 align-middle">
                                        <div className="flex items-center justify-end gap-2">
                                          {optimized ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setPreviewTarget({
                                                  productId: product.id,
                                                  image,
                                                })
                                              }
                                              className="inline-flex size-8 items-center justify-center rounded-lg border border-[#D1D1D1] bg-white text-[#303030] hover:bg-[#FAFAFA]"
                                              aria-label="Preview"
                                              title="Preview"
                                            >
                                              <Eye className="size-4" />
                                            </button>
                                          ) : null}

                                          {optimized ? (
                                            <button
                                              type="button"
                                              disabled={
                                                isRestoring || !image.imageFile
                                              }
                                              onClick={() =>
                                                void restoreImage(
                                                  product,
                                                  image,
                                                )
                                              }
                                              className="btn-default"
                                            >
                                              {isRestoring ? (
                                                <ButtonLoader label="Restoring…" />
                                              ) : (
                                                "Restore"
                                              )}
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              disabled={
                                                isBusy || !image.imageFile
                                              }
                                              onClick={() =>
                                                optimizeImage(
                                                  product.id,
                                                  image,
                                                )
                                              }
                                              className="btn-default"
                                            >
                                              {isBusy ? (
                                                <ButtonLoader label="Optimizing…" />
                                              ) : (
                                                "Optimize"
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {!isLoadingProducts && products.length === 0 ? (
              <div className="rounded-lg border border-[#EBEBEB] bg-[#FAFAFA] px-4 py-10 text-center text-sm text-[#616161]">
                No products found.
              </div>
            ) : null}
          </div>
        ) : null}

        {/* PAGINATION */}

        {listType === "product" ? (
          <ListingPagination
            className="mt-5"
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            perPage={productsPerPage}
            perPageOptions={[...PRODUCT_PER_PAGE_OPTIONS]}
            onPerPageChange={handleProductsPerPageChange}
            itemLabel="products"
            totalItems={
              totalPages > 0
                ? (totalPages - 1) * productsPerPage +
                  (safeCurrentPage === totalPages
                    ? products.length
                    : productsPerPage)
                : products.length
            }
          />
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
              className="mt-6 w-full custom-btn !h-auto !py-2"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}