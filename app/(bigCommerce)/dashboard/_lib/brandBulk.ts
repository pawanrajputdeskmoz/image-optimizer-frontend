import type { Brand, BrandBulkOptimizeItem } from "../types";

export function readBrandStoreHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    localStorage.getItem("store_hash")?.trim() ||
    localStorage.getItem("shop")?.trim() ||
    ""
  );
}

export function toBrandBulkOptimizeItem(brand: Brand): BrandBulkOptimizeItem {
  const item: BrandBulkOptimizeItem = {
    brand_id: brand.id,
    image_url: brand.imageUrl,
    brand_name: brand.name,
  };

  if (brand.isOptimized) {
    item.optimization_status = brand.optimizationStatus;
  }

  return item;
}

export function toBrandBulkRestoreItem(brand: Brand): BrandBulkOptimizeItem {
  const item: BrandBulkOptimizeItem = {
    brand_id: brand.id,
    image_url: brand.optimizedUrl ?? brand.imageUrl,
    brand_name: brand.name,
    optimization_status: brand.optimizationStatus,
  };

  return item;
}
