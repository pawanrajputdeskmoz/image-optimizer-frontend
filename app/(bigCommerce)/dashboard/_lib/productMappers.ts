import { readStoredChannel } from "@/app/_lib/channelStorage";
import type {
  ApiImage,
  ApiImageSize,
  ApiProduct,
  ImageItem,
  Product,
  RestoreImageResponse,
  SingleImageOptimizationResponse,
} from "../types";

export const PLACEHOLDER_IMAGE = "https://via.placeholder.com/60";

export function isImageOptimized(image: ImageItem): boolean {
  return (
    image.optimizationStatus === "optimized" || image.optimized === true
  );
}

export function parseIsThumbnail(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
}

export function getThumbnailImage(images: ImageItem[]): ImageItem | undefined {
  if (!images?.length) {
    return undefined;
  }

  const thumbnail = images.find((img) => img.isThumbnail);
  if (thumbnail) {
    return thumbnail;
  }

  const lowestSort = [...images].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  return lowestSort[0];
}

function readCustomUrlPath(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object" && "url" in value) {
    const url = (value as { url?: unknown }).url;
    if (typeof url === "string" && url.trim()) {
      return url.trim();
    }
  }

  return null;
}

function normalizeStorefrontPath(path: string): string {
  const trimmed = path.trim();
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

function resolveProductCustomPath(product: ApiProduct): string | null {
  for (const candidate of [
    product.custom_url,
    product.customUrl,
    product.product_url,
    product.url,
  ]) {
    const path = readCustomUrlPath(candidate);
    if (path) {
      return path;
    }
  }

  return null;
}

export function buildProductWebsiteUrl(product: ApiProduct): string | null {
  for (const candidate of [product.storefront_url, product.storefrontUrl]) {
    if (typeof candidate === "string" && candidate.trim()) {
      const url = candidate.trim();
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url.endsWith("/") ? url : `${url}/`;
      }
    }
  }

  const channel = readStoredChannel();
  const base = (channel?.url ?? channel?.domain ?? "").replace(/\/$/, "");
  const path = resolveProductCustomPath(product);

  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path.endsWith("/") ? path : `${path}/`;
  }

  if (!base) {
    return null;
  }

  return `${base}${normalizeStorefrontPath(path)}`;
}

export function buildProductImageUrl(
  storeHash: string,
  imageFile?: string,
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

export function formatBytesToKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatImageSizeKb(size?: ApiImageSize): string {
  if (typeof size?.bytes !== "number" || !Number.isFinite(size.bytes)) {
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
  data: NonNullable<SingleImageOptimizationResponse["data"]>,
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

export function applyOptimizationResult(
  image: ImageItem,
  oldImageId: number,
  data: NonNullable<SingleImageOptimizationResponse["data"]>,
): ImageItem {
  const matchesOldId =
    image.id === oldImageId || Number(data.old_image_id) === image.id;

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

export function resolveRestoredAltText(
  image: ImageItem,
  data: NonNullable<RestoreImageResponse["data"]>,
): string {
  if (data.old_alt_text !== undefined || data.oldAltText !== undefined) {
    return String(data.old_alt_text ?? data.oldAltText ?? "").trim();
  }

  const fromMeta = data.bigcommerce_metadata?.description;
  if (fromMeta != null) {
    return String(fromMeta).trim();
  }

  return image.alt;
}

function resolveRestoredImageFile(
  image: ImageItem,
  data: NonNullable<RestoreImageResponse["data"]>,
): { imageFile: string; fileName: string } {
  const oldFileName = (data.old_file_name ?? data.oldFileName)?.trim();
  if (oldFileName) {
    return { imageFile: oldFileName, fileName: oldFileName };
  }

  const fromUrl = imageFileFromProductUrl(data.restored_image_url);
  if (fromUrl) {
    return { imageFile: fromUrl, fileName: fromUrl };
  }

  return { imageFile: image.imageFile, fileName: image.fileName };
}

function resolveRestoredSizeLabel(
  image: ImageItem,
  data: NonNullable<RestoreImageResponse["data"]>,
): string {
  const bytes = data.old_image_size ?? data.oldImageSize;
  if (typeof bytes === "number" && Number.isFinite(bytes)) {
    return formatBytesToKb(bytes);
  }

  return image.sizeLabel;
}

export function applyRestoreResult(
  image: ImageItem,
  removedImageId: number,
  data: NonNullable<RestoreImageResponse["data"]>,
): ImageItem {
  const matches =
    image.id === removedImageId ||
    Number(data.removed_image_id) === image.id;

  if (!matches) {
    return image;
  }

  const { imageFile, fileName } = resolveRestoredImageFile(image, data);
  const restoredUrl = data.restored_image_url ?? image.url;

  return {
    ...image,
    id: data.restored_image_id ?? image.id,
    url: restoredUrl,
    imageFile,
    fileName,
    alt: resolveRestoredAltText(image, data),
    sizeLabel: resolveRestoredSizeLabel(image, data),
    optimized: false,
    optimizationStatus: undefined,
  };
}

function mapApiImage(image: ApiImage, storeHash: string): ImageItem {
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
    isThumbnail: parseIsThumbnail(image.is_thumbnail ?? image.isThumbnail),
    sortOrder: typeof image.sort_order === "number" ? image.sort_order : 0,
    optimizationStatus,
    optimized: isOpt,
  };
}

export function mapApiProduct(product: ApiProduct, storeHash: string): Product {
  const images: ImageItem[] = Array.isArray(product.images)
    ? product.images.map((image) => mapApiImage(image, storeHash)).reverse()
    : [];

  return {
    id: product.id,
    name: product.name,
    images,
    websiteUrl: buildProductWebsiteUrl(product),
  };
}
