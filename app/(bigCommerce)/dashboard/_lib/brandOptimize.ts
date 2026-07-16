import { readChannelId } from "@/app/_lib/channelStorage";
import type { Brand, BrandOptimizePayload } from "../types";

export function buildBrandOptimizePayload(
  brand: Pick<Brand, "id" | "name" | "imageUrl" | "optimizationStatus">,
): BrandOptimizePayload {
  if (!brand.imageUrl.trim()) {
    throw new Error("image_url is required.");
  }

  return {
    channel_id: readChannelId(),
    brand_id: brand.id,
    image_url: brand.imageUrl,
    brand_name: brand.name,
    optimization_status: brand.optimizationStatus,
  };
}
