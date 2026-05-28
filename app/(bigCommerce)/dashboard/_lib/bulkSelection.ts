import type { BulkOptimizeImageItem, ImageItem } from "../types";

function readChannelId(): number {
  if (typeof window === "undefined") {
    return 1;
  }
  try {
    const raw = localStorage.getItem("channel");
    if (!raw) return 1;
    const parsed = JSON.parse(raw) as { channel_id?: number | string };
    const id = parsed?.channel_id;
    if (typeof id === "number") return id;
    if (typeof id === "string" && id.trim() !== "") {
      const n = Number(id);
      return Number.isFinite(n) ? n : 1;
    }
    return 1;
  } catch {
    return 1;
  }
}

export function buildBulkOptimizeItem(
  productId: number,
  image: ImageItem,
): BulkOptimizeImageItem {
  return {
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
}

export function bulkSelectionKey(productId: number, imageId: number) {
  return `${productId}-${imageId}`;
}
