import { formatBytesToKb, formatImageSizeKb } from "./productMappers";
import type {
  ApiCategory,
  Category,
  CategoryOptimizeResultData,
  ContextualImage,
} from "../types";

export function isCategoryOptimized(status?: string | null): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return normalized === "optimized" || normalized === "uploaded";
}

export function isCategoryOptimizeDisabled(status?: string | null): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return (
    normalized === "optimized" ||
    normalized === "uploaded" ||
    normalized === "optimizing" ||
    normalized === "processing" ||
    normalized === "no_image"
  );
}

export function getCategoryOptimizeButtonLabel(
  status: string,
  isBusy: boolean,
): string {
  if (isBusy) {
    return "Optimizing…";
  }

  const normalized = status.trim().toLowerCase();

  if (normalized === "no_image") {
    return "No Image";
  }

  if (normalized === "optimized" || normalized === "uploaded") {
    return "Optimized";
  }

  if (normalized === "optimizing" || normalized === "processing") {
    return "Optimizing…";
  }

  return "Optimize";
}

function fileNameFromUrl(url?: string | null): string {
  if (!url?.trim()) {
    return "image";
  }

  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split("/").filter(Boolean).pop();
    if (segment) {
      return decodeURIComponent(segment.split("?")[0] ?? segment);
    }
  } catch {
    const parts = url.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) {
      return decodeURIComponent(last.split("?")[0] ?? last);
    }
  }

  return "image";
}

export function mapApiCategory(category: ApiCategory): Category | null {
  const id = category.category_id;
  if (!Number.isFinite(id)) {
    return null;
  }

  const imageUrl = category.image_url?.trim() ?? "";
  const hasImage = category.has_image === true || imageUrl.length > 0;
  const canOptimize = category.can_optimize === true;

  const name =
    category.category_name?.trim() ||
    category.name?.trim() ||
    `Category ${id}`;

  // Use no_image when the category has no image, regardless of what backend sends
  const rawStatus = category.status ?? "pending";
  const status = !hasImage ? "no_image" : rawStatus;
  const optimizationStatus = category.optimization_status ?? status;

  const treeId =
    typeof category.tree_id === "number" && Number.isFinite(category.tree_id)
      ? category.tree_id
      : null;

  return {
    id,
    name,
    treeId,
    imageUrl,
    hasImage,
    canOptimize,
    optimizedUrl: category.optimized_url ?? null,
    sizeLabel: formatImageSizeKb(category.size),
    optimizedSizeLabel:
      typeof category.optimized_size === "number"
        ? formatBytesToKb(category.optimized_size)
        : "—",
    status,
    optimizationStatus,
    isOptimized: isCategoryOptimized(optimizationStatus),
    errorMessage: category.error_message ?? null,
  };
}

export function mapApiCategories(
  categories: ApiCategory[] | undefined,
): Category[] {
  if (!Array.isArray(categories)) {
    return [];
  }

  return categories
    .map(mapApiCategory)
    .filter((c): c is Category => c !== null);
}

export function applyCategoryOptimizationResult(
  category: Category,
  result: CategoryOptimizeResultData,
): Category {
  const status = result.status ?? category.status;
  const optimizationStatus =
    result.optimization_status ?? status ?? category.optimizationStatus;
  const optimizedUrl =
    result.new_image_url ?? result.optimized_url ?? category.optimizedUrl;
  const originalUrl = result.old_image_url ?? category.imageUrl;

  const optimizedBytes =
    result.optimized_size ?? result.optimizedImage?.optimized?.size;
  const originalBytes = result.optimizedImage?.original?.size;

  const optimizedSizeLabel =
    typeof optimizedBytes === "number" && Number.isFinite(optimizedBytes)
      ? formatBytesToKb(optimizedBytes)
      : category.optimizedSizeLabel;

  const sizeLabel =
    typeof optimizedBytes === "number" && Number.isFinite(optimizedBytes)
      ? formatBytesToKb(optimizedBytes)
      : typeof originalBytes === "number" && Number.isFinite(originalBytes)
        ? formatBytesToKb(originalBytes)
        : category.sizeLabel;

  return {
    ...category,
    name: result.category_name?.trim() || category.name,
    imageUrl: originalUrl,
    optimizedUrl,
    sizeLabel,
    optimizedSizeLabel,
    status,
    optimizationStatus,
    isOptimized: isCategoryOptimized(optimizationStatus),
    errorMessage: result.error_message ?? null,
  };
}

export function findCategoryByContextualImage(
  categories: Category[],
  image: ContextualImage,
): Category | undefined {
  const categoryId = Number(image.sourceId ?? image.id);
  if (!Number.isFinite(categoryId)) {
    return undefined;
  }

  return categories.find((category) => category.id === categoryId);
}

export function mapCategoryToContextualImage(category: Category): ContextualImage {
  const displayUrl = category.optimizedUrl ?? category.imageUrl;

  return {
    key: `category-${category.id}`,
    id: String(category.id),
    sourceType: "category",
    sourceKey: `category::${category.id}`,
    sourceId: String(category.id),
    sourceName: category.name,
    context: "Category image",
    url: displayUrl,
    originalUrl: category.imageUrl,
    optimizedUrl: category.optimizedUrl,
    fileName: category.hasImage ? fileNameFromUrl(displayUrl) : category.name,
    sizeLabel: category.hasImage ? category.sizeLabel : "—",
    optimizedSizeLabel: category.optimizedSizeLabel,
    optimizationStatus: category.optimizationStatus,
    status: category.status,
    isOptimized: category.isOptimized,
    isUpdateSupported: category.canOptimize,
    errorMessage: category.errorMessage,
  };
}
