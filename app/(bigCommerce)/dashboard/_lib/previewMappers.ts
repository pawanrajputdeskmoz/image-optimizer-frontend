import { storageFilePathToPublicUrl } from "./previewFiles";
import type { PreviewImageData } from "../types";

export type ProductPreviewView = {
  originalUrl: string;
  optimizedUrl: string;
  oldName: string;
  newName: string;
  oldAltText: string;
  newAltText: string;
  oldSizeLabel: string;
  newSizeLabel: string;
  savedBytes: number | null;
  savedPercentage: number | null;
};

function formatBytesLabel(bytes?: number | null): string | null {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
    return null;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function resolveSizeLabel(
  ...sources: (number | string | null | undefined)[]
): string {
  for (const source of sources) {
    if (typeof source === "number") {
      const label = formatBytesLabel(source);
      if (label) {
        return label;
      }
    }
    if (typeof source === "string" && source.trim()) {
      return source.trim();
    }
  }
  return "—";
}

function resolveText(
  ...sources: (string | null | undefined)[]
): string {
  for (const source of sources) {
    if (typeof source === "string" && source.trim()) {
      return source.trim();
    }
  }
  return "—";
}

export function parseProductPreviewData(
  preview: PreviewImageData | undefined,
): ProductPreviewView | null {
  if (!preview) {
    return null;
  }

  const originalUrl =
    storageFilePathToPublicUrl(preview.files?.original) ??
    storageFilePathToPublicUrl(preview.old?.file_path) ??
    (preview.image_url?.trim() || null);

  const optimizedUrl =
    storageFilePathToPublicUrl(preview.files?.optimized) ??
    storageFilePathToPublicUrl(preview.new?.file_path);

  if (!originalUrl || !optimizedUrl) {
    return null;
  }

  const oldName = resolveText(
    preview.comparison?.name?.old,
    preview.old?.name,
    preview.old_file_name,
    preview.oldData?.imageName,
  );

  const newName = resolveText(
    preview.comparison?.name?.new,
    preview.new?.name,
    preview.oldData?.newImageName,
    oldName !== "—" ? oldName : undefined,
  );

  const oldAltText = resolveText(
    preview.comparison?.alt_text?.old,
    preview.old?.alt_text,
    preview.old_alt_text,
    preview.oldData?.altText,
  );

  const newAltText = resolveText(
    preview.comparison?.alt_text?.new,
    preview.new?.alt_text,
    preview.oldData?.newAltText,
    oldAltText !== "—" ? oldAltText : undefined,
  );

  const oldSizeLabel = resolveSizeLabel(
    preview.comparison?.size?.old,
    preview.old?.size,
    preview.image_size,
    preview.oldData?.original?.size,
  );

  const newSizeLabel = resolveSizeLabel(
    preview.comparison?.size?.new,
    preview.new?.size,
    preview.oldData?.optimized?.size,
  );

  const savedBytes =
    preview.comparison?.size?.saved_bytes ?? preview.saved_bytes ?? null;
  const savedPercentage =
    preview.comparison?.size?.saved_percentage ??
    preview.saved_percentage ??
    null;

  return {
    originalUrl,
    optimizedUrl,
    oldName,
    newName,
    oldAltText,
    newAltText,
    oldSizeLabel,
    newSizeLabel,
    savedBytes:
      typeof savedBytes === "number" && Number.isFinite(savedBytes)
        ? savedBytes
        : null,
    savedPercentage:
      typeof savedPercentage === "number" && Number.isFinite(savedPercentage)
        ? savedPercentage
        : null,
  };
}
