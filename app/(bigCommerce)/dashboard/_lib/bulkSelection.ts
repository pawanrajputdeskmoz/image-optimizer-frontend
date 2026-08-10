import { readChannelId } from "@/app/_lib/channelStorage";
import type { ImageActionPayload, ImageItem } from "../types";

export function buildImageActionPayload(
  productId: number,
  image: ImageItem,
): ImageActionPayload {
  const payload: ImageActionPayload = {
    image_id: image.id,
    product_id: productId,
    image_url: image.imageFile,
    is_thumbnail: image.isThumbnail ?? false,
    sort_order: image.sortOrder ?? 0,
    shop:
      typeof window !== "undefined"
        ? localStorage.getItem("shop") ?? ""
        : "",
    channel_id: readChannelId(),
    store_id:
      typeof window !== "undefined"
        ? localStorage.getItem("user_id") ?? ""
        : "",
  };

  // Backup for preserve-when-generator-off; backend still prefers BC description.
  if (typeof image.alt === "string" && image.alt.trim()) {
    payload.alt_text = image.alt.trim();
  }

  return payload;
}

/** @deprecated Use buildImageActionPayload */
export function buildBulkOptimizeItem(
  productId: number,
  image: ImageItem,
): ImageActionPayload {
  return buildImageActionPayload(productId, image);
}

export function bulkSelectionKey(productId: number, imageId: number) {
  return `${productId}-${imageId}`;
}
