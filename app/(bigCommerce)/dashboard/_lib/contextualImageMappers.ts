import { formatBytesToKb, formatImageSizeKb } from "./productMappers";
import type { ApiContextualImage, ContextualImage } from "../types";

export function isContextualImageOptimized(
  status?: string | null,
): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return normalized === "optimized" || normalized === "completed";
}

export function getContextualImageKey(image: ApiContextualImage): string {
  if (typeof image.id === "string" && image.id.trim()) {
    return image.id;
  }

  if (typeof image.source_key === "string" && image.source_key.trim()) {
    return image.source_key;
  }

  const url = image.current_url ?? image.original_url ?? "";
  return url || `contextual-${Math.random().toString(36).slice(2)}`;
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

export function applyContextualOptimizationResult(
  image: ContextualImage,
  result: {
    status?: string;
    optimization_status?: string;
    optimized_url?: string;
  },
): ContextualImage {
  const optimizationStatus =
    result.optimization_status ?? result.status ?? "optimized";

  return {
    ...image,
    optimizationStatus,
    isOptimized: isContextualImageOptimized(optimizationStatus),
    optimizedUrl: result.optimized_url ?? image.optimizedUrl,
    url: result.optimized_url ?? image.url,
  };
}

export function mapApiContextualImage(
  image: ApiContextualImage,
): ContextualImage {
  const originalUrl = image.original_url ?? image.current_url ?? "";
  const url = image.current_url ?? image.original_url ?? "";
  const optimizationStatus = image.optimization_status ?? "pending";

  return {
    key: getContextualImageKey(image),
    id: image.id ?? null,
    sourceType: image.source_type ?? "",
    sourceKey: image.source_key ?? "",
    sourceId: image.source_id ?? null,
    sourceName: image.source_name ?? "",
    context: image.context ?? "",
    url,
    originalUrl,
    optimizedUrl: image.optimized_url ?? null,
    fileName: fileNameFromUrl(url),
    sizeLabel:
      formatImageSizeKb(image.size) !== "—"
        ? formatImageSizeKb(image.size)
        : typeof image.original_size === "number"
          ? formatBytesToKb(image.original_size)
          : "—",
    optimizedSizeLabel:
      typeof image.optimized_size === "number"
        ? formatBytesToKb(image.optimized_size)
        : "—",
    optimizationStatus,
    isOptimized: isContextualImageOptimized(optimizationStatus),
    isUpdateSupported: image.is_update_supported === true,
    errorMessage: image.error_message ?? null,
  };
}

export function mapApiContextualImages(
  images: ApiContextualImage[] | undefined,
): ContextualImage[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.map(mapApiContextualImage);
}
