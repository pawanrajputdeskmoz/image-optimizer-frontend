"use client";

import ImageComparePopup from "@/app/_components/imagePreview";
import type { ContextualImage } from "../types";

type ContextualImagePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  image: ContextualImage | null;
};

export default function ContextualImagePreviewModal({
  open,
  onClose,
  image,
}: ContextualImagePreviewModalProps) {
  if (!open || !image) {
    return null;
  }

  const originalUrl = image.originalUrl || image.url;
  const optimizedUrl = image.optimizedUrl;

  if (!originalUrl || !optimizedUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-black"
            aria-label="Close"
          >
            ✕
          </button>
          <h2 className="mb-4 text-lg font-semibold">Original vs Optimized</h2>
          <p className="mb-4 text-sm text-red-600">
            Preview images are not available for this item.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <ImageComparePopup
      beforeSrc={originalUrl}
      afterSrc={optimizedUrl}
      open
      onClose={onClose}
      beforeLabel={`Original · ${image.sizeLabel}`}
      afterLabel={`Optimized · ${image.optimizedSizeLabel}`}
    />
  );
}
