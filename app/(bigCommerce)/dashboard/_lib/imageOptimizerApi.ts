import { ApiCall } from "@/app/_api/apiCall";
import type { ImageActionPayload, ImageItem } from "../types";
import { buildImageActionPayload } from "./bulkSelection";
import { buildBrandOptimizePayload } from "./brandOptimize";
import { buildCategoryOptimizePayload } from "./categoryOptimize";
import type {
  Brand,
  BrandBulkOptimizeItem,
  BrandBulkOptimizeResponse,
  BrandBulkRestoreResponse,
  BrandOptimizeResponse,
  BrandPreviewImageApiResponse,
  BrandRestoreResponse,
  BrandsApiResponse,
  BulkImageOptimizationResponse,
  BulkOptimizeAllBrandsResponse,
  BulkOptimizeAllCategoriesResponse,
  BulkRestoreAllBrandsResponse,
  BulkRestoreAllCategoriesResponse,
  BulkRestoreAllProductsResponse,
  BulkRestoreResponse,
  CategoriesApiResponse,
  Category,
  CategoryBulkOptimizeItem,
  CategoryBulkOptimizeResponse,
  CategoryBulkRestoreResponse,
  CategoryOptimizeResponse,
  CategoryPreviewImageApiResponse,
  CategoryRestoreResponse,
  ClientDashboardStatsResponse,
  MerchantPlansResponse,
  SelectPlanResponse,
  ImageListType,
  PreviewImageApiResponse,
  ProductApiResponse,
  RestoreImageResponse,
  SingleImageOptimizationResponse,
  UpdateAltTextResponse,
} from "../types";

export function buildPreviewPayload(
  productId: number,
  image: Pick<
    ImageItem,
    "id" | "imageFile" | "isThumbnail" | "sortOrder"
  >,
): ImageActionPayload {
  return buildImageActionPayload(productId, image as ImageItem);
}

export async function fetchProductList(params: {
  storeHash: string;
  page: number;
  limit: number;
  search?: string;
  listType?: ImageListType;
}) {
  const trimmedSearch = params.search?.trim();
  const body: Record<string, string | number> = {
    store_hash: params.storeHash,
    page: params.page,
    limit: params.limit,
  };

  if (trimmedSearch) {
    body.search = trimmedSearch;
  }

  const query: Record<string, string> = {
    type: params.listType ?? "product",
  };

  return ApiCall("image-optimizer/get-all-products", body, {
    query,
  }) as Promise<ProductApiResponse>;
}

export async function optimizeSingleImage(
  productId: number,
  image: ImageItem,
) {
  return ApiCall(
    `image-optimizer/single-image-optimization/${image.id}`,
    buildImageActionPayload(productId, image),
  ) as Promise<SingleImageOptimizationResponse>;
}

export async function bulkOptimizeImages(payload: ImageActionPayload[]) {
  return ApiCall("image-optimizer/bulk-image-optimization", payload, {
    method: "POST",
    rawBody: true,
  }) as Promise<BulkImageOptimizationResponse>;
}

export async function bulkOptimizeAllImages() {
  return ApiCall(
    "image-optimizer/bulk-image-optimization-all",
    {},
  ) as Promise<BulkImageOptimizationResponse>;
}

export async function restoreSingleImage(productId: number, image: ImageItem) {
  return ApiCall(
    `image-optimizer/restore-image/${image.id}`,
    buildImageActionPayload(productId, image),
  ) as Promise<RestoreImageResponse>;
}

export async function bulkRestoreImages(payload: ImageActionPayload[]) {
  return ApiCall("image-optimizer/bulk-restore", payload, {
    method: "POST",
    rawBody: true,
  }) as Promise<BulkRestoreResponse>;
}

export async function bulkRestoreAllImages() {
  return ApiCall(
    "image-optimizer/bulk-restore-all",
    {},
  ) as Promise<BulkRestoreAllProductsResponse>;
}

export async function updateImageAltText(params: {
  imageId: number;
  productId: number;
  altText: string;
}) {
  return ApiCall(
    `image-optimizer/update-alt-text/${params.imageId}`,
    {
      product_id: params.productId,
      alt_text: params.altText,
    },
    { method: "PATCH" },
  ) as Promise<UpdateAltTextResponse>;
}

export async function fetchPreviewImageData(
  productId: number,
  image: ImageItem,
) {
  return ApiCall(
    "image-optimizer/get-preview-img-data",
    buildPreviewPayload(productId, image),
  ) as Promise<PreviewImageApiResponse>;
}

export async function fetchCategoryList(params: {
  storeHash: string;
  page: number;
  limit: number;
}) {
  return ApiCall("category-images/get-all-categories", {
    store_hash: params.storeHash,
    page: params.page,
    limit: params.limit,
  }) as Promise<CategoriesApiResponse>;
}

export async function fetchBrandList(params: {
  page: number;
  limit: number;
}) {
  return ApiCall("brand-images/get-all-brands", {
    page: params.page,
    limit: params.limit,
  }) as Promise<BrandsApiResponse>;
}

export async function optimizeBrandImage(
  brand: Pick<Brand, "id" | "name" | "imageUrl" | "optimizationStatus">,
) {
  const payload = buildBrandOptimizePayload(brand);

  return ApiCall(
    "brand-images/optimize-brand",
    payload,
  ) as Promise<BrandOptimizeResponse>;
}

export async function restoreBrandImage(brand: Pick<Brand, "id">) {
  return ApiCall("brand-images/restore-brand", {
    brand_id: brand.id,
  }) as Promise<BrandRestoreResponse>;
}

export async function bulkOptimizeBrandImages(
  items: BrandBulkOptimizeItem[],
  storeHash: string,
) {
  return ApiCall("brand-images/bulk-optimize-brands-checkbox", {
    store_hash: storeHash,
    brands: items,
  }) as Promise<BrandBulkOptimizeResponse>;
}

export async function bulkRestoreBrandImages(
  items: BrandBulkOptimizeItem[],
  storeHash: string,
) {
  return ApiCall("brand-images/bulk-restore-brands-checkbox", {
    store_hash: storeHash,
    brands: items,
  }) as Promise<BrandBulkRestoreResponse>;
}

export async function fetchBrandPreviewImageData(params: { brandId: number }) {
  return ApiCall("brand-images/get-brand-preview-img-data", {
    brand_id: params.brandId,
  }) as Promise<BrandPreviewImageApiResponse>;
}

export async function optimizeCategoryImage(
  category: Pick<
    Category,
    "id" | "name" | "treeId" | "imageUrl" | "status"
  >,
) {
  const payload = buildCategoryOptimizePayload(category);

  return ApiCall(
    "category-images/optimize-category",
    payload,
  ) as Promise<CategoryOptimizeResponse>;
}

export async function bulkRestoreAllCategories() {
  return ApiCall(
    "category-images/bulk-restore-categories-all",
    {},
  ) as Promise<BulkRestoreAllCategoriesResponse>;
}

export async function bulkOptimizeAllCategories() {
  return ApiCall(
    "category-images/bulk-optimize-categories-all",
    {},
  ) as Promise<BulkOptimizeAllCategoriesResponse>;
}

export async function bulkOptimizeAllBrands() {
  return ApiCall(
    "brand-images/bulk-optimize-brands-all",
    {},
  ) as Promise<BulkOptimizeAllBrandsResponse>;
}

export async function bulkRestoreAllBrands() {
  return ApiCall(
    "brand-images/bulk-restore-brands-all",
    {},
  ) as Promise<BulkRestoreAllBrandsResponse>;
}

export async function bulkOptimizeCategoryImages(
  items: CategoryBulkOptimizeItem[],
) {
  return ApiCall("category-images/bulk-optimize-categories-checkbox", {
    categories: items,
  }) as Promise<CategoryBulkOptimizeResponse>;
}

export async function bulkRestoreCategoryImages(
  items: CategoryBulkOptimizeItem[],
) {
  return ApiCall("category-images/bulk-restore-categories-checkbox", {
    categories: items,
  }) as Promise<CategoryBulkRestoreResponse>;
}

export async function restoreCategoryImage(
  category: Pick<Category, "id" | "treeId">,
) {
  return ApiCall("category-images/restore-category", {
    category_id: category.id,
    tree_id: category.treeId,
  }) as Promise<CategoryRestoreResponse>;
}

export async function fetchCategoryPreviewImageData(params: {
  categoryId: number;
}) {
  return ApiCall("category-images/get-category-preview-img-data", {
    category_id: params.categoryId,
  }) as Promise<CategoryPreviewImageApiResponse>;
}

export async function fetchDashboardStats() {
  return ApiCall("settings/dashboard-stats", {}, {
    method: "GET",
  }) as Promise<ClientDashboardStatsResponse>;
}

export async function fetchMerchantPlans() {
  return ApiCall("settings/plans", {}, {
    method: "GET",
  }) as Promise<MerchantPlansResponse>;
}

export async function selectMerchantPlan(planSlug: string) {
  return ApiCall("settings/select-plan", { plan_slug: planSlug }) as Promise<SelectPlanResponse>;
}
