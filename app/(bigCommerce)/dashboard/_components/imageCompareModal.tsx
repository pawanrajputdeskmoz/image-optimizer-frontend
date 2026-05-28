"use client";

import { ApiCall } from "@/app/_api/apiCall";
import ImageComparePopup from "@/app/_components/imagePreview";
import { useCallback, useEffect, useState } from "react";
import { storageFilePathToPublicUrl } from "../_lib/previewFiles";
import type {
  ImageItem,
  PreviewImageApiResponse,
  PreviewImageData,
} from "../types";

function formatBytesLabel(bytes?: number): string | null {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) {
    return null;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function resolveSizeLabel(
  ...sources: (number | string | undefined)[]
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

function parsePreviewPayload(preview: PreviewImageData | undefined): {
  originalUrl: string;
  optimizedUrl: string;
  originalSizeLabel: string;
  optimizedSizeLabel: string;
} | null {
  if (!preview) {
    return null;
  }

  const originalUrl = storageFilePathToPublicUrl(preview.files?.original);
  const optimizedUrl = storageFilePathToPublicUrl(preview.files?.optimized);

  if (!originalUrl || !optimizedUrl) {
    return null;
  }

  return {
    originalUrl,
    optimizedUrl,
    originalSizeLabel: resolveSizeLabel(preview.oldData?.original?.size),
    optimizedSizeLabel: resolveSizeLabel(preview.oldData?.optimized?.size),
  };
}

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
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [originalSizeLabel, setOriginalSizeLabel] = useState("—");
  const [optimizedSizeLabel, setOptimizedSizeLabel] = useState("—");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    setOriginalUrl(null);
    setOptimizedUrl(null);

    try {
      const response = (await ApiCall("image-optimizer/get-preview-img-data", {
        product_id: productId,
        image_id: image.id,
      })) as PreviewImageApiResponse;

      if (response?.error || response?.success === false) {
        setFetchError("Could not load preview images.");
        return;
      }

      const parsed = parsePreviewPayload(response?.data);

      if (!parsed) {
        setFetchError("Preview files are not available for comparison.");
        return;
      }

      setOriginalUrl(parsed.originalUrl);
      setOptimizedUrl(parsed.optimizedUrl);
      setOriginalSizeLabel(parsed.originalSizeLabel);
      setOptimizedSizeLabel(parsed.optimizedSizeLabel);
    } catch {
      setFetchError("Could not load preview images.");
    } finally {
      setIsLoading(false);
    }
  }, [productId, image.id]);

  useEffect(() => {
    if (open) {
      void loadPreview();
    } else {
      setOriginalUrl(null);
      setOptimizedUrl(null);
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
  children: React.ReactNode;
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
