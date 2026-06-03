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

export type Product = {
  id: number;
  name: string;
  images: ImageItem[];
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

