export type ImageItem = {
  id: number;
  url: string;
  /** BigCommerce image_file path (e.g. i/612/foo.jpg) */
  imageFile: string;
  fileName: string;
  alt: string;
  /** File size in KB from API */
  sizeLabel: string;
  optimized?: boolean;
  /** From API when image is already optimized or after successful optimization */
  optimizationStatus?: string;
  /** Compression savings when known (e.g. 50) */
  savedPercent?: number | null;
  isThumbnail?: boolean;
  sortOrder?: number;
};

export type ImageListType = "product" | "categories" | "brand";

export type Product = {
  id: number;
  name: string;
  images: ImageItem[];
  /** Storefront product page URL */
  websiteUrl?: string | null;
};

export type ApiImageSize = {
  bytes?: number | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
};

export type ApiImage = {
  id: number;
  product_id: number;
  description?: string;
  image_file?: string;
  url_zoom?: string;
  url_standard?: string;
  url_thumbnail?: string;
  url_tiny?: string;
  is_thumbnail?: boolean | number | string;
  isThumbnail?: boolean | number | string;
  sort_order?: number;
  date_modified?: string;
  /** BigCommerce / backend optimization state when listing products */
  optimization_status?: string;
  /** Attached in batch by get-all-products */
  size?: ApiImageSize;
};

export type ApiProduct = {
  id: number;
  name: string;
  images?: ApiImage[];
  custom_url?: string | { url?: string; is_customized?: boolean };
  customUrl?: string | { url?: string; is_customized?: boolean };
  product_url?: string;
  url?: string;
  storefront_url?: string;
  storefrontUrl?: string;
};

export type ProductApiResponse = {
  success?: boolean;
  data?: ApiProduct[];
  pagination?: {
    total_pages?: number;
    current_page?: number;
  };
  error?: string;
};

export type OptimizedImageMetrics = {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
};

export type OptimizationImageMeta = {
  oldImageName?: string | null;
  oldAltText?: string | null;
  newImageName?: string | null;
  newAltText?: string | null;
};

export type SingleImageOptimizationResponse = {
  success?: boolean;
  skipped?: boolean;
  message?: string;
  data?: {
    status?: string;
    skip_reason?: string;
    old_image_id?: string | number;
    new_image_id?: number;
    new_image_url?: string;
    imageMeta?: OptimizationImageMeta;
    optimizedImage?: {
      original?: OptimizedImageMetrics;
      optimized?: OptimizedImageMetrics;
      compression?: {
        savedBytes?: number;
        savedPercent?: number;
      };
    };
  };
  error?: string;
};

export type PreviewOldData = {
  imageName?: string;
  altText?: string;
  newImageName?: string;
  newAltText?: string;
  original?: OptimizedImageMetrics;
  optimized?: OptimizedImageMetrics;
  saved_bytes?: number;
  saved_percentage?: number;
};

export type PreviewImageMeta = {
  name?: string;
  alt_text?: string;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  file_path?: string | null;
  url?: string | null;
};

export type PreviewImageData = {
  image_id?: number;
  product_id?: number;
  old?: PreviewImageMeta;
  new?: PreviewImageMeta;
  comparison?: {
    name?: { old?: string; new?: string };
    alt_text?: { old?: string; new?: string };
    size?: {
      old?: number | null;
      new?: number | null;
      saved_bytes?: number | null;
      saved_percentage?: number | null;
    };
  };
  saved_bytes?: number | null;
  saved_percentage?: number | null;
  optimization?: Record<string, unknown>;
  oldData?: PreviewOldData | null;
  files?: {
    original?: string | null;
    optimized?: string | null;
  };
  urls?: {
    original?: string | null;
    optimized?: string | null;
  };
  /** @deprecated legacy preview fields */
  image_url?: string;
  old_file_name?: string;
  image_size?: string;
  old_alt_text?: string;
};

export type PreviewImageApiResponse = {
  success?: boolean;
  data?: PreviewImageData;
  error?: string;
};

export type UpdateAltTextResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export type RestoreImageResponse = {
  success?: boolean;
  message?: string;
  data?: {
    restored_image_id?: number;
    removed_image_id?: number;
    product_id?: number;
    restored_image_url?: string;
    backup_retention_days?: number;
    old_image_size?: number;
    oldImageSize?: number;
    old_alt_text?: string | null;
    oldAltText?: string | null;
    old_file_name?: string | null;
    oldFileName?: string | null;
    bigcommerce_metadata?: {
      description?: string | null;
    };
  };
  error?: string;
};

/** Shared body for single/bulk optimize and restore requests */
export type ImageActionPayload = {
  image_id: number;
  product_id: number;
  image_url: string;
  is_thumbnail: boolean;
  sort_order: number;
  shop: string;
  channel_id: number;
  store_id: string;
};

/** @deprecated Use ImageActionPayload */
export type BulkOptimizeImageItem = ImageActionPayload;

export type BulkImageOptimizationResponse = {
  success?: boolean;
  message?: string;
  data?: {
    job_uuid?: string;
    queued?: number;
    skipped?: number;
    quota_limited?: boolean;
    quota_remaining?: number | null;
    not_queued_due_to_quota?: number;
  };
  error?: string;
};

export type BulkRestoreResponse = {
  success?: boolean;
  message?: string;
  data?: {
    queued?: number;
    skipped?: number;
    restored?: number;
    failed?: number;
  };
  error?: string;
};

export type StandardApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

/** Flat listing images from categories, brand, etc. */
export type ContextualImage = {
  key: string;
  id: string | null;
  sourceType: string;
  sourceKey: string;
  sourceId: string | null;
  sourceName: string;
  context: string;
  url: string;
  originalUrl: string;
  optimizedUrl: string | null;
  fileName: string;
  sizeLabel: string;
  optimizedSizeLabel: string;
  optimizationStatus: string;
  /** Normalized DB status — used for category optimize button state */
  status?: string;
  isOptimized: boolean;
  isUpdateSupported: boolean;
  errorMessage: string | null;
};

export type ApiContextualImage = {
  id?: string | null;
  source_type?: string;
  source_key?: string;
  source_id?: string | null;
  source_name?: string;
  context?: string;
  is_update_supported?: boolean;
  image_path?: string;
  original_url?: string;
  current_url?: string;
  optimized_url?: string | null;
  size?: ApiImageSize;
  original_size?: number | null;
  optimized_size?: number | null;
  optimization_status?: string;
  error_message?: string | null;
};

export type ApiCategory = {
  category_id: number;
  name?: string;
  category_name?: string;
  image_url?: string | null;
  has_image?: boolean;
  can_optimize?: boolean;
  optimized_url?: string | null;
  optimization_status?: string;
  status?: string;
  optimized_size?: number | null;
  size?: ApiImageSize;
  error_message?: string | null;
  tree_id?: number | null;
};

export type Category = {
  id: number;
  name: string;
  treeId: number | null;
  imageUrl: string;
  hasImage: boolean;
  canOptimize: boolean;
  optimizedUrl: string | null;
  sizeLabel: string;
  optimizedSizeLabel: string;
  status: string;
  optimizationStatus: string;
  isOptimized: boolean;
  errorMessage: string | null;
};

export type CategoryOptimizePayload = {
  channel_id: number;
  category_id: number;
  tree_id: number | null;
  image_url: string;
  category_name: string;
  force?: boolean;
  status?: string;
};

export type CategoryOptimizeResultData = {
  category_id?: number;
  category_name?: string | null;
  image_url?: string;
  old_image_url?: string;
  new_image_url?: string;
  optimized_url?: string | null;
  status?: string;
  optimization_status?: string;
  optimized_size?: number | null;
  error_message?: string | null;
  optimizedImage?: {
    original?: OptimizedImageMetrics;
    optimized?: OptimizedImageMetrics;
    compression?: {
      savedBytes?: number;
      savedPercent?: number;
    };
  };
};

export type CategoryOptimizeResponse = {
  success?: boolean;
  skipped?: boolean;
  message?: string;
  data?: CategoryOptimizeResultData;
  error?: string;
};

export type CategoryRestorePayload = {
  channel_id: number;
  category_id: number;
  tree_id: number | null;
};

export type CategoryBulkOptimizeItem = {
  category_id: number;
  image_url: string;
  category_name: string;
  tree_id: number | null;
};

export type CategoryBulkOptimizePayload = {
  channel_id: number;
  categories: CategoryBulkOptimizeItem[];
};

export type CategoryBulkOptimizeResultItem = {
  category_id?: number;
  category_name?: string;
  status?: string;
  message?: string;
  new_image_url?: string;
  error?: string;
};

export type CategoryBulkOptimizeResponse = {
  success?: boolean;
  message?: string;
  results?: CategoryBulkOptimizeResultItem[];
  data?: CategoryBulkOptimizeResultItem[];
  error?: string;
};

export type CategoryBulkRestoreResultData = {
  job_uuid?: string;
  job_type?: string;
  queue?: string;
  total_categories?: number;
  queued_categories?: number;
  skipped_categories?: number;
  job?: unknown;
  jobs?: unknown[];
  skipped?: unknown[];
};

export type CategoryBulkRestoreResponse = {
  success?: boolean;
  message?: string;
  data?: CategoryBulkRestoreResultData;
  error?: string;
};

export type BulkRestoreAllCategoriesResponse = {
  success?: boolean;
  message?: string;
  data?: {
    queued?: number;
    skipped?: number;
    total?: number;
    job_uuid?: string;
  };
  error?: string;
};

export type BulkRestoreAllProductsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    queued?: number;
    skipped?: number;
    total?: number;
    job_uuid?: string;
  };
  error?: string;
};

export type BulkRestoreAllBrandsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    queued?: number;
    skipped?: number;
    total?: number;
    job_uuid?: string;
  };
  error?: string;
};

export type BulkOptimizeAllCategoriesResponse = {
  success?: boolean;
  message?: string;
  data?: {
    queued?: number;
    skipped?: number;
    total?: number;
    job_uuid?: string;
  };
  error?: string;
};

export type BulkOptimizeAllBrandsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    queued?: number;
    skipped?: number;
    total?: number;
    job_uuid?: string;
  };
  error?: string;
};

export type CategoryRestoreResultData = {
  category_id?: number;
  channel_id?: number;
  tree_id?: number;
  category_name?: string;
  restored_image_url?: string;
  original_url?: string;
  verified?: boolean;
  original_size?: number;
  original_width?: number;
  original_height?: number;
  original_format?: string;
  status?: string;
  message?: string;
};

export type CategoryRestoreResponse = {
  success?: boolean;
  message?: string;
  data?: CategoryRestoreResultData;
  error?: string;
};

export type CategoryPreviewImageData = {
  category_id?: number;
  category_name?: string;
  channel_id?: number;
  tree_id?: number;
  status?: {
    optimization_status?: string;
    image_update_status?: string;
    optimization_started_at?: string;
    optimized_at?: string;
  };
  imageData?: {
    original?: OptimizedImageMetrics;
    optimized?: OptimizedImageMetrics;
    saved_bytes?: number;
    saved_percentage?: number;
    original_url?: string;
    optimized_url?: string;
  };
  files?: {
    original?: string | null;
    optimized?: string | null;
  };
};

export type CategoryPreviewImageApiResponse = {
  success?: boolean;
  data?: CategoryPreviewImageData;
  message?: string;
  error?: string;
};

export type CategoriesApiResponse = {
  success?: boolean;
  message?: string;
  count?: number;
  tree_ids?: number[];
  data?: ApiCategory[];
  pagination?: {
    total_pages?: number;
    current_page?: number;
    total?: number;
    count?: number;
    per_page?: number;
  };
  error?: string;
};

export type ApiBrand = {
  id: number;
  name: string;
  page_title?: string;
  image_url?: string | null;
  custom_url?: { url?: string; is_customized?: boolean } | null;
  has_image?: boolean;
  storefront_url?: string | null;
  optimization_status?: string;
  image_update_status?: string;
  size?: ApiImageSize;
};

export type Brand = {
  id: number;
  name: string;
  imageUrl: string;
  optimizedUrl: string | null;
  hasImage: boolean;
  storefrontUrl: string | null;
  optimizationStatus: string;
  imageUpdateStatus: string;
  sizeLabel: string;
  isOptimized: boolean;
};

export type BrandsApiResponse = {
  success?: boolean;
  message?: string;
  data?: ApiBrand[];
  pagination?: {
    total_pages?: number;
    current_page?: number;
    total?: number;
    count?: number;
    per_page?: number;
  };
  error?: string;
};

export type BrandOptimizePayload = {
  channel_id: number;
  brand_id: number;
  image_url: string;
  brand_name: string;
  optimization_status?: string;
};

export type BrandOptimizeResultData = {
  brand_id?: number;
  brand_name?: string | null;
  image_url?: string;
  old_image_url?: string;
  new_image_url?: string;
  optimized_url?: string | null;
  status?: string;
  optimization_status?: string;
  optimized_size?: number | null;
  error_message?: string | null;
  optimizedImage?: {
    original?: OptimizedImageMetrics;
    optimized?: OptimizedImageMetrics;
    compression?: {
      savedBytes?: number;
      savedPercent?: number;
    };
  };
};

export type BrandOptimizeResponse = {
  success?: boolean;
  skipped?: boolean;
  message?: string;
  data?: BrandOptimizeResultData;
  error?: string;
};

export type BrandBulkOptimizeItem = {
  brand_id: number;
  image_url: string;
  brand_name: string;
  optimization_status?: string;
};

export type BrandBulkOptimizePayload = {
  store_hash: string;
  brands: BrandBulkOptimizeItem[];
};

export type BrandBulkOptimizeResponse = {
  success?: boolean;
  message?: string;
  data?: {
    queued?: number;
    skipped?: number;
    job_uuid?: string;
  };
  error?: string;
};

export type BrandBulkRestoreResponse = {
  success?: boolean;
  message?: string;
  data?: {
    queued?: number;
    skipped?: number;
    job_uuid?: string;
  };
  error?: string;
};

export type BrandRestoreResultData = {
  brand_id?: number;
  channel_id?: number;
  brand_name?: string;
  restored_image_url?: string;
  original_url?: string;
  verified?: boolean;
  original_size?: number;
  original_width?: number;
  original_height?: number;
  original_format?: string;
  status?: string;
  message?: string;
};

export type BrandRestoreResponse = {
  success?: boolean;
  message?: string;
  data?: BrandRestoreResultData;
  error?: string;
};

export type BrandPreviewImageData = {
  brand_id?: number;
  brand_name?: string;
  channel_id?: number;
  status?: {
    optimization_status?: string;
    image_update_status?: string;
    optimization_started_at?: string;
    optimized_at?: string;
  };
  imageData?: {
    original?: OptimizedImageMetrics;
    optimized?: OptimizedImageMetrics;
    saved_bytes?: number;
    saved_percentage?: number;
    original_url?: string;
    optimized_url?: string;
  };
  files?: {
    original?: string | null;
    optimized?: string | null;
  };
};

export type BrandPreviewImageApiResponse = {
  success?: boolean;
  data?: BrandPreviewImageData;
  message?: string;
  error?: string;
};

export type DashboardStatCard = {
  value: number;
  display: string;
  subtitle: string;
};

export type ActiveBulkFlags = {
  product?: boolean;
  category?: boolean;
  brand?: boolean;
};

export type ClientDashboardStatsData = {
  pending_images: DashboardStatCard;
  pending_restore_images?: DashboardStatCard;
  pending_mode?: "optimize" | "restore";
  optimized_images: DashboardStatCard;
  total_data_saved: DashboardStatCard;
  image_quota: {
    percent: number;
    display: string;
    used: number;
    limit: number;
    plan: string;
    subtitle: string;
  };
  active_job?: boolean;
  active_bulk_jobs?: ActiveBulkFlags;
  active_bulk_restores?: ActiveBulkFlags;
  failed_images?: number;
  average_saving_percent?: number;
  last_optimized_at?: string | null;
};

export type ClientDashboardStatsResponse = {
  success?: boolean;
  message?: string;
  data?: ClientDashboardStatsData;
  error?: string;
};

export type MerchantPlan = {
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  monthly_image_limit: number | null;
  is_active: boolean;
  display_order: number;
};

export type MerchantPlansResponse = {
  success?: boolean;
  message?: string;
  data?: {
    plans?: MerchantPlan[];
    selected_plan?: string;
    effective_plan?: MerchantPlan | null;
    client_plan?: Record<string, unknown> | null;
  };
  error?: string;
};

export type SelectPlanResponse = {
  success?: boolean;
  message?: string;
  data?: {
    selected_plan?: string;
    plan?: MerchantPlan;
  };
  error?: string;
};

