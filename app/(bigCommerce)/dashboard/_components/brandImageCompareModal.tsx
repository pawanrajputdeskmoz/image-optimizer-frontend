"use client";

import ImageComparePopup from "@/app/_components/imagePreview";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { isApiError } from "../_lib/apiUtils";
import { fetchBrandPreviewImageData } from "../_lib/imageOptimizerApi";
import { storageFilePathToPublicUrl } from "../_lib/previewFiles";
import type { Brand, BrandPreviewImageData } from "../types";

function formatBytesLabel(bytes?: number | null): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
    return "—";
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function parseBrandPreviewPayload(preview: BrandPreviewImageData | undefined): {
  originalUrl: string;
  optimizedUrl: string;
  originalSizeLabel: string;
  optimizedSizeLabel: string;
} | null {
  if (!preview) {
    return null;
  }

  const originalUrl =
    preview.imageData?.original_url?.trim() ||
    storageFilePathToPublicUrl(preview.files?.original) ||
    "";
  const optimizedUrl =
    preview.imageData?.optimized_url?.trim() ||
    storageFilePathToPublicUrl(preview.files?.optimized) ||
    "";

  if (!originalUrl || !optimizedUrl) {
    return null;
  }

  return {
    originalUrl,
    optimizedUrl,
    originalSizeLabel: formatBytesLabel(preview.imageData?.original?.size),
    optimizedSizeLabel: formatBytesLabel(preview.imageData?.optimized?.size),
  };
}

type BrandImageCompareModalProps = {
  open: boolean;
  onClose: () => void;
  brand: Brand | null;
};

export default function BrandImageCompareModal({
  open,
  onClose,
  brand,
}: BrandImageCompareModalProps) {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [originalSizeLabel, setOriginalSizeLabel] = useState("—");
  const [optimizedSizeLabel, setOptimizedSizeLabel] = useState("—");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!brand) {
      return;
    }

    setIsLoading(true);
    setFetchError(null);
    setOriginalUrl(null);
    setOptimizedUrl(null);

    try {
      const response = await fetchBrandPreviewImageData({
        brandId: brand.id,
      });

      if (isApiError(response)) {
        setFetchError("Could not load brand preview images.");
        return;
      }

      if (response?.success === false) {
        setFetchError(response.message || "Could not load brand preview images.");
        return;
      }

      const parsed = parseBrandPreviewPayload(response?.data);

      if (!parsed) {
        setFetchError("Preview files are not available for comparison.");
        return;
      }

      setOriginalUrl(parsed.originalUrl);
      setOptimizedUrl(parsed.optimizedUrl);
      setOriginalSizeLabel(parsed.originalSizeLabel);
      setOptimizedSizeLabel(parsed.optimizedSizeLabel);
    } catch {
      setFetchError("Could not load brand preview images.");
    } finally {
      setIsLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    if (open && brand) {
      void loadPreview();
    } else {
      setOriginalUrl(null);
      setOptimizedUrl(null);
      setFetchError(null);
    }
  }, [open, brand, loadPreview]);

  if (!open || !brand) {
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

  if (fetchError || !originalUrl || !optimizedUrl) {
    return (
      <CompareShell onClose={onClose}>
        <p className="mb-4 text-sm text-red-600">
          {fetchError ?? "Preview images are not available."}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          Close
        </button>
      </CompareShell>
    );
  }

  return (
    <ImageComparePopup
      beforeSrc={originalUrl}
      afterSrc={optimizedUrl}
      open
      onClose={onClose}
      beforeLabel={`Original · ${originalSizeLabel}`}
      afterLabel={`Optimized · ${optimizedSizeLabel}`}
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
