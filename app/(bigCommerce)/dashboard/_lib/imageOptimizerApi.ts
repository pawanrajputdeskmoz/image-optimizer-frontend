import { ApiCall } from "@/app/_api/apiCall";
import type { ImageActionPayload, ImageItem } from "../types";
import { buildImageActionPayload } from "./bulkSelection";
import { buildCategoryOptimizePayload } from "./categoryOptimize";
import { buildHomeImageOptimizePayload } from "./homeImageOptimize";
import type {
  BulkImageOptimizationResponse,
  BulkRestoreResponse,
  CategoriesApiResponse,
  Category,
  CategoryBulkOptimizeItem,
  CategoryBulkOptimizeResponse,
  CategoryOptimizeResponse,
  CategoryPreviewImageApiResponse,
  CategoryRestoreResponse,
  ContextualImage,
  HomeBannerOptimizeResponse,
  HomeImagesApiResponse,
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
  const body = {
    store_hash: params.storeHash,
    page: params.page,
    limit: params.limit,
  };

  const query: Record<string, string> = {
    type: params.listType ?? "product",
  };

  if (params.search?.trim()) {
    query.search = params.search.trim();
  }

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

export async function bulkOptimizeCategoryImages(
  items: CategoryBulkOptimizeItem[],
) {
  return ApiCall("category-images/bulk-optimize-categories-checkbox", {
    categories: items,
  }) as Promise<CategoryBulkOptimizeResponse>;
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

export async function fetchHomeImages(sync = true) {
  return ApiCall("image-optimizer/home-images", {}, {
    method: "GET",
    query: { sync },
  }) as Promise<HomeImagesApiResponse>;
}

export async function optimizeHomeImage(
  image: Pick<ContextualImage, "sourceType" | "sourceKey" | "originalUrl">,
) {
  const payload = buildHomeImageOptimizePayload(image);

  return ApiCall(
    "image-optimizer/home-banner/optimize",
    payload,
  ) as Promise<HomeBannerOptimizeResponse>;
}
