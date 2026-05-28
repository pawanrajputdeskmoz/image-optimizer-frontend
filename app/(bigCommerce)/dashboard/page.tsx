"use client";

import { ApiCall } from "@/app/_api/apiCall";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import AltTextField from "./_components/altTextField";
import ImageCompareModal from "./_components/imageCompareModal";
import {
  buildBulkOptimizeItem,
  bulkSelectionKey,
} from "./_lib/bulkSelection";
import type {
  ApiImageSize,
  ApiProduct,
  BulkImageOptimizationResponse,
  BulkOptimizeImageItem,
  ImageItem,
  Product,
  ProductApiResponse,
  RestoreImageResponse,
  SingleImageOptimizationResponse,
  UpdateAltTextResponse,
} from "./types";

type PreviewTarget = {
  productId: number;
  image: ImageItem;
};

const PRODUCTS_PER_PAGE = 5;

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/60";

function altTextKey(productId: number, imageId: number) {
  return `${productId}-${imageId}`;
}

function isImageOptimized(image: ImageItem): boolean {
  return (
    image.optimizationStatus === "optimized" || image.optimized === true
  );
}

function buildProductImageUrl(
  storeHash: string,
  imageFile?: string
): string | null {
  if (!imageFile?.trim() || !storeHash) {
    return null;
  }

  const trimmed = imageFile.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://store-${storeHash}.mybigcommerce.com/product_images/${trimmed.replace(/^\//, "")}`;
}

function formatBytesToKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatImageSizeKb(size?: ApiImageSize): string {
  if (
    typeof size?.bytes !== "number" ||
    !Number.isFinite(size.bytes)
  ) {
    return "—";
  }

  return formatBytesToKb(size.bytes);
}

function imageFileFromProductUrl(url?: string): string | null {
  if (!url?.trim()) {
    return null;
  }

  const marker = "/product_images/";
  const idx = url.indexOf(marker);
  if (idx === -1) {
    return null;
  }

  return url.slice(idx + marker.length);
}

function resolveOptimizedImageFile(
  image: ImageItem,
  data: NonNullable<SingleImageOptimizationResponse["data"]>
): { imageFile: string; fileName: string } {
  const fromUrl = imageFileFromProductUrl(data.new_image_url);
  if (fromUrl) {
    return { imageFile: fromUrl, fileName: fromUrl };
  }

  const newName = data.imageMeta?.newImageName?.trim();
  if (!newName) {
    return { imageFile: image.imageFile, fileName: image.fileName };
  }

  if (newName.includes("/")) {
    return { imageFile: newName, fileName: newName };
  }

  const slash = image.imageFile.lastIndexOf("/");
  const prefix = slash >= 0 ? image.imageFile.slice(0, slash + 1) : "";
  const imageFile = `${prefix}${newName}`;
  return { imageFile, fileName: imageFile };
}

function applyOptimizationResult(
  image: ImageItem,
  oldImageId: number,
  data: NonNullable<SingleImageOptimizationResponse["data"]>
): ImageItem {
  const matchesOldId =
    image.id === oldImageId ||
    Number(data.old_image_id) === image.id;

  if (!matchesOldId) {
    return image;
  }

  const optimizedBytes = data.optimizedImage?.optimized?.size;
  const sizeLabel =
    typeof optimizedBytes === "number" && Number.isFinite(optimizedBytes)
      ? formatBytesToKb(optimizedBytes)
      : image.sizeLabel;

  const { imageFile, fileName } = resolveOptimizedImageFile(image, data);

  const newAltText = data.imageMeta?.newAltText;
  const alt =
    newAltText != null && String(newAltText).trim() !== ""
      ? String(newAltText).trim()
      : image.alt;

  return {
    ...image,
    id: data.new_image_id ?? image.id,
    url: data.new_image_url ?? image.url,
    imageFile,
    fileName,
    alt,
    sizeLabel,
    optimized: true,
    optimizationStatus: "optimized",
  };
}

function applyRestoreResult(
  image: ImageItem,
  removedImageId: number,
  data: NonNullable<RestoreImageResponse["data"]>
): ImageItem {
  const matches =
    image.id === removedImageId ||
    Number(data.removed_image_id) === image.id;

  if (!matches) {
    return image;
  }

  const restoredUrl = data.restored_image_url;
  const imageFile =
    imageFileFromProductUrl(restoredUrl) ?? image.imageFile;

  return {
    ...image,
    id: data.restored_image_id ?? image.id,
    url: restoredUrl ?? image.url,
    imageFile,
    fileName: imageFile,
    optimized: false,
    optimizationStatus: undefined,
  };
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    Record<string, BulkOptimizeImageItem>
  >({});
  const [bulkOptimizePending, setBulkOptimizePending] = useState(false);

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

  const getDefaultImage = (
    images: ImageItem[]
  ): ImageItem | undefined => {
    if (!images?.length) {
      return undefined;
    }

    return (
      images.find((img) => img.isThumbnail) ||
      images[0]
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
        const response = (await ApiCall(
          `image-optimizer/update-alt-text/${image.id}`,
          {
            product_id: product.id,
            alt_text: alt,
          },
          { method: "PATCH" }
        )) as UpdateAltTextResponse;

        if (response && typeof response === "object" && "error" in response) {
          return;
        }

        if (response?.success === false) {
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
    const payload = Object.values(bulkSelected);
    if (!payload.length) {
      return;
    }

    setBulkOptimizePending(true);

    try {
      const response = (await ApiCall(
        "image-optimizer/bulk-image-optimization",
        payload,
        { method: "POST", rawBody: true }
      )) as BulkImageOptimizationResponse;

      if (response && typeof response === "object" && "error" in response) {
        return;
      }

      if (response?.success === false) {
        toast.error(response.message || "Bulk optimization failed");
        return;
      }

      const queued = response?.data?.queued ?? payload.length;
      const skipped = response?.data?.skipped ?? 0;

      setOptimizingKeys((prev) => {
        const next = { ...prev };
        for (const item of payload) {
          next[`${item.product_id}-${item.image_id}`] = true;
        }
        return next;
      });

      setBulkSelected({});
      toast.success(
        skipped > 0
          ? `${queued} image(s) queued (${skipped} skipped)`
          : `${queued} image(s) queued for optimization`
      );
    } finally {
      setBulkOptimizePending(false);
    }
  }, [bulkSelected]);

  const optimizeImage = useCallback(
    async (productId: number, image: ImageItem) => {
      const key = `${productId}-${image.id}`;

      setOptimizingKeys((prev) => ({ ...prev, [key]: true }));

      try {
        const response = (await ApiCall(
          `image-optimizer/single-image-optimization/${image.id}`,
          {
            product_id: productId,
            image_url: image.imageFile,
            is_thumbnail: image.isThumbnail ?? false,
            sort_order: image.sortOrder ?? 0,
          }
        )) as SingleImageOptimizationResponse;

        if (response?.error) {
          console.error("Optimize failed:", response.error);
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
        const alt = getDisplayAlt(product.id, image);
        const imageName =
          image.fileName.split("/").pop() || image.fileName || "";

        const response = (await ApiCall(
          `image-optimizer/restore-image/${image.id}`,
          {
            product_id: product.id,
            image_url: image.url,
            imageName,
            altText: alt,
          }
        )) as RestoreImageResponse;

        if (response && typeof response === "object" && "error" in response) {
          return;
        }

        if (response?.success === false) {
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
        setAltDrafts((prev) => {
          const oldKey = altTextKey(product.id, image.id);
          const newKey = altTextKey(product.id, newImageId);
          const next = { ...prev };
          delete next[oldKey];
          delete next[newKey];
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
    [getDisplayAlt]
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
    let isCancelled = false;

    const fetchProducts = async () => {
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

        const requestBody: Record<string, unknown> = {
          store_hash: storeHash,
          page: currentPage,
          limit: PRODUCTS_PER_PAGE,
        };

        const response = (await ApiCall(
          "image-optimizer/get-all-products",
          requestBody,
          debouncedSearch ? { query: { query: debouncedSearch } } : undefined
        )) as ProductApiResponse;

        if (isCancelled || response?.error) {
          if (!isCancelled && response?.error) {
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
            if (
              !updated[product.id] &&
              product.images?.length
            ) {
              const defaultImage =
                getDefaultImage(product.images);

              if (defaultImage) {
                updated[product.id] =
                  defaultImage;
              }
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

    fetchProducts();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, debouncedSearch]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="rounded-2xl bg-white p-4 shadow-lg">

        {/* HEADER */}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">Image Optimizer</h1>

          {bulkSelectedCount > 0 ? (
            <button
              type="button"
              disabled={bulkOptimizePending}
              onClick={() => void bulkOptimizeSelected()}
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkOptimizePending
                ? "Optimizing…"
                : `Optimize (${bulkSelectedCount})`}
            </button>
          ) : null}
        </div>

        {/* SEARCH */}

        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search product..."
          className="mb-4 w-full rounded border px-3 py-2 md:w-64"
        />

        {/* PRODUCTS */}

        {isLoadingProducts && products.length === 0 ? (
          <div className="flex items-center justify-center gap-3 rounded-lg border bg-gray-50 px-4 py-10 text-sm text-gray-600">
            <span className="inline-block size-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            Loading products…
          </div>
        ) : null}

        {productsError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {productsError}
          </div>
        ) : null}

        {isLoadingProducts && products.length > 0 ? (
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
            <span className="inline-block size-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            Updating…
          </div>
        ) : null}

        {products.some((p) =>
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

                return (
                  <AccordionItem key={product.id} value={`product-${product.id}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        <Image
                          src={selectedImage?.url || PLACEHOLDER_IMAGE}
                          alt={product.name}
                          width={36}
                          height={36}
                          unoptimized
                          className="size-9 rounded object-cover"
                        />

                        <p>{product.name}</p>
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
                              className={`flex items-center gap-4 rounded border p-3 transition-all ${
                                isSelected
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

                              <Image
                                src={image.url}
                                alt={image.alt}
                                width={56}
                                height={56}
                                unoptimized
                                className="size-14 cursor-pointer rounded object-cover"
                                onClick={() => selectImage(product.id, image)}
                              />

                              {/* INFO */}

                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {image.fileName}
                                  <span className="ml-2 font-normal text-gray-500">
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
                                  className={`rounded px-3 py-2 text-sm text-white disabled:cursor-not-allowed ${
                                    optimized
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

        {/* PAGINATION */}

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
      </div>

      {previewTarget ? (
        <ImageCompareModal
          open
          onClose={() => setPreviewTarget(null)}
          productId={previewTarget.productId}
          image={previewTarget.image}
        />
      ) : null}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| API MAPPER
|--------------------------------------------------------------------------
*/

function mapApiProduct(
  product: ApiProduct,
  storeHash: string
): Product {
  const images: ImageItem[] = Array.isArray(
    product.images
  )
    ? product.images
        .map((image) => {
          const optimizationStatus = image.optimization_status;
          const isOpt = optimizationStatus === "optimized";
          const imageFile = image.image_file?.trim() || "";

          return {
            id: image.id,

            imageFile,

            url:
              buildProductImageUrl(storeHash, imageFile) ||
              image.url_thumbnail ||
              image.url_zoom ||
              image.url_tiny ||
              PLACEHOLDER_IMAGE,

            fileName: imageFile || `image-${image.id}`,

            alt: image.description || "",

            sizeLabel: formatImageSizeKb(image.size),

            isThumbnail:
              image.is_thumbnail || false,

            sortOrder:
              typeof image.sort_order === "number"
                ? image.sort_order
                : 0,

            optimizationStatus,
            optimized: isOpt,
          };
        })
        // Newest images last from API → show latest at top inside accordion
        .reverse()
    : [];

  return {
    id: product.id,
    name: product.name,
    images,
  };
}