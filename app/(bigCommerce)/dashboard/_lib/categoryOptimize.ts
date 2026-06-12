import { readChannelId } from "@/app/_lib/channelStorage";
import type { Category, CategoryOptimizePayload } from "../types";

export function buildCategoryOptimizePayload(
  category: Pick<
    Category,
    "id" | "name" | "treeId" | "imageUrl" | "status"
  >,
): CategoryOptimizePayload {
  if (!category.imageUrl.trim()) {
    throw new Error("image_url is required.");
  }

  return {
    channel_id: readChannelId(),
    category_id: category.id,
    tree_id: category.treeId,
    image_url: category.imageUrl,
    category_name: category.name,
    force: false,
    status: category.status,
  };
}
