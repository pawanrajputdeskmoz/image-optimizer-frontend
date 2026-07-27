"use client";

import ImageComparePopup from "@/app/_components/imagePreview";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { isApiError } from "../_lib/apiUtils";
import { fetchPreviewImageData } from "../_lib/imageOptimizerApi";
import {
  parseProductPreviewData,
  type ProductPreviewView,
} from "../_lib/previewMappers";
import type { ImageItem } from "../types";

type ImageCompareModalProps = {
  open: boolean;
  onClose: () => void;
  productId: number;
  image: ImageItem;
};

export default function ImageCompareModal({
  open,
  onClose,
  productId,
  image,
}: ImageCompareModalProps) {
  const [preview, setPreview] = useState<ProductPreviewView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    setPreview(null);

    try {
      const response = await fetchPreviewImageData(productId, image);

      if (isApiError(response) || response?.success === false) {
        setFetchError("Could not load preview images.");
        return;
      }

      const parsed = parseProductPreviewData(response?.data);

      if (!parsed) {
        setFetchError("Preview files are not available for comparison.");
        return;
      }

      setPreview(parsed);
    } catch {
      setFetchError("Could not load preview images.");
    } finally {
      setIsLoading(false);
    }
  }, [productId, image]);

  useEffect(() => {
    if (open) {
      void loadPreview();
    } else {
      setPreview(null);
      setFetchError(null);
    }
  }, [open, loadPreview]);

  if (!open) {
    return null;
  }

  if (isLoading) {
    return (
      <CompareShell onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-8">
          <span className="inline-block size-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <p className="text-sm text-gray-600">Loading comparison…</p>
        </div>
      </CompareShell>
    );
  }

  if (fetchError || !preview) {
    return (
      <CompareShell onClose={onClose}>
        <p className="mb-4 text-sm text-red-600">
          {fetchError ?? "Preview images are not available."}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="custom-btn"
        >
          Close
        </button>
      </CompareShell>
    );
  }

  return (
    <ImageComparePopup
      beforeSrc={preview.originalUrl}
      afterSrc={preview.optimizedUrl}
      open
      onClose={onClose}
      beforeLabel="Original"
      afterLabel="Optimized"
      comparisonRows={[
        {
          label: "Name",
          before: preview.oldName,
          after: preview.newName,
        },
        {
          label: "Alt",
          before: preview.oldAltText,
          after: preview.newAltText,
        },
        {
          label: "Size",
          before: preview.oldSizeLabel,
          after: preview.newSizeLabel,
          savedPercentage: preview.savedPercentage,
        },
      ]}
    />
  );
}

function CompareShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
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
        {children}
      </div>
    </div>
  );
}
