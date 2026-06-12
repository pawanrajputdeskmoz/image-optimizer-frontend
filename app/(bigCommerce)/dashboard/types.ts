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
  isThumbnail?: boolean;
  sortOrder?: number;
};

export type ImageListType = "product" | "categories" | "brand" | "home";

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
  message?: string;
  data?: {
    status?: string;
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
  original?: OptimizedImageMetrics;
  optimized?: OptimizedImageMetrics;
  saved_bytes?: number;
  saved_percentage?: number;
};

export type PreviewImageData = {
  image_id?: number;
  product_id?: number;
  optimization?: Record<string, unknown>;
  oldData?: PreviewOldData | null;
  files?: {
    original?: string | null;
    optimized?: string | null;
  };
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
  };
  error?: string;
};

export type BulkRestoreResponse = {
  success?: boolean;
  message?: string;
  data?: {
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

/** Flat listing images from home, categories, brand, etc. */
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

export type HomeImagesApiResponse = {
  success?: boolean;
  message?: string;
  count?: number;
  sources?: Record<string, number>;
  errors?: string[];
  data?: ApiContextualImage[];
  error?: string;
};

export const HOME_IMAGE_SOURCE_TYPES = [
  "widget",
  "content_page",
  "storefront_html",
] as const;

export type HomeImageSourceType = (typeof HOME_IMAGE_SOURCE_TYPES)[number];

export type HomeImageOptimizePayload = {
  channel_id: number;
  source_type: HomeImageSourceType;
  source_key: string;
  original_url: string;
};

export type HomeBannerOptimizeResponse = {
  success?: boolean;
  message?: string;
  data?: {
    status?: string;
    optimization_status?: string;
    optimized_url?: string;
  };
  error?: string;
};

