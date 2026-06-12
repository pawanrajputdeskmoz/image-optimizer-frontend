import { readChannelId } from "@/app/_lib/channelStorage";
import {
  HOME_IMAGE_SOURCE_TYPES,
  type ContextualImage,
  type HomeImageOptimizePayload,
  type HomeImageSourceType,
} from "../types";

export function isAllowedHomeImageSourceType(
  sourceType: string,
): sourceType is HomeImageSourceType {
  return (HOME_IMAGE_SOURCE_TYPES as readonly string[]).includes(sourceType);
}

export function buildHomeImageOptimizePayload(
  image: Pick<ContextualImage, "sourceType" | "sourceKey" | "originalUrl">,
): HomeImageOptimizePayload {
  if (!isAllowedHomeImageSourceType(image.sourceType)) {
    throw new Error(
      `Unsupported source_type "${image.sourceType}". Allowed values: ${HOME_IMAGE_SOURCE_TYPES.join(", ")}.`,
    );
  }

  if (!image.sourceKey.trim()) {
    throw new Error("source_key is required.");
  }

  if (!image.originalUrl.trim()) {
    throw new Error("original_url is required.");
  }

  return {
    channel_id: readChannelId(),
    source_type: image.sourceType,
    source_key: image.sourceKey,
    original_url: image.originalUrl,
  };
}

export function canOptimizeHomeImage(image: ContextualImage): boolean {
  return (
    image.isUpdateSupported &&
    isAllowedHomeImageSourceType(image.sourceType) &&
    Boolean(image.sourceKey.trim()) &&
    Boolean(image.originalUrl.trim())
  );
}
