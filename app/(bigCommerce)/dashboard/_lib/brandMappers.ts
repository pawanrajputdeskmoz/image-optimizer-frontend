import type { ApiBrand, Brand, BrandOptimizeResultData, BrandRestoreResultData } from "../types";
import {
  formatBytesToKb,
  formatImageSizeKb,
  PLACEHOLDER_IMAGE,
} from "./productMappers";

export function isBrandOptimized(status?: string | null): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return normalized === "optimized" || normalized === "completed";
}

export function isBrandOptimizeDisabled(status?: string | null): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return (
    normalized === "optimized" ||
    normalized === "completed" ||
    normalized === "optimizing" ||
    normalized === "processing"
  );
}

export function getBrandOptimizeButtonLabel(
  status: string,
  isBusy: boolean,
): string {
  if (isBusy) {
    return "Optimizing…";
  }

  const normalized = status.trim().toLowerCase();

  if (normalized === "optimized" || normalized === "completed") {
    return "Optimized";
  }

  if (normalized === "optimizing" || normalized === "processing") {
    return "Optimizing…";
  }

  return "Optimize";
}

export function mapApiBrand(brand: ApiBrand): Brand {
  const optimizationStatus = brand.optimization_status?.trim() || "pending";

  return {
    id: brand.id,
    name: brand.name,
    imageUrl: brand.image_url?.trim() || PLACEHOLDER_IMAGE,
    optimizedUrl: null,
    hasImage: brand.has_image === true,
    storefrontUrl: brand.storefront_url?.trim() || null,
    optimizationStatus,
    imageUpdateStatus: brand.image_update_status?.trim() || "pending",
    sizeLabel: formatImageSizeKb(brand.size),
    isOptimized: isBrandOptimized(optimizationStatus),
  };
}

export function mapApiBrands(brands: ApiBrand[] | undefined): Brand[] {
  if (!Array.isArray(brands)) {
    return [];
  }

  return brands.map(mapApiBrand);
}

export function applyBrandOptimizationResult(
  brand: Brand,
  result: BrandOptimizeResultData,
): Brand {
  const optimizationStatus =
    result.optimization_status ?? result.status ?? brand.optimizationStatus;

  const optimizedBytes =
    result.optimized_size ?? result.optimizedImage?.optimized?.size;

  const sizeLabel =
    typeof optimizedBytes === "number" && Number.isFinite(optimizedBytes)
      ? formatBytesToKb(optimizedBytes)
      : brand.sizeLabel;

  const optimizedUrl =
    result.new_image_url ?? result.optimized_url ?? brand.optimizedUrl;

  return {
    ...brand,
    name: result.brand_name?.trim() || brand.name,
    imageUrl: result.old_image_url ?? brand.imageUrl,
    optimizedUrl,
    optimizationStatus,
    sizeLabel,
    isOptimized: isBrandOptimized(optimizationStatus),
  };
}

export function applyBrandRestoreResult(
  brand: Brand,
  result: BrandRestoreResultData,
): Brand {
  const restoredUrl =
    result.restored_image_url ?? result.original_url ?? brand.imageUrl;

  const sizeLabel =
    typeof result.original_size === "number" && Number.isFinite(result.original_size)
      ? formatBytesToKb(result.original_size)
      : brand.sizeLabel;

  return {
    ...brand,
    name: result.brand_name?.trim() || brand.name,
    imageUrl: restoredUrl,
    optimizedUrl: null,
    optimizationStatus: "pending",
    imageUpdateStatus: "pending",
    sizeLabel,
    isOptimized: false,
  };
}
