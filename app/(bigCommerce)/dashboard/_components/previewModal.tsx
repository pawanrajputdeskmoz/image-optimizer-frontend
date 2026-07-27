"use client";

import { ApiCall } from "@/app/_api/apiCall";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { parseProductPreviewData } from "../_lib/previewMappers";
import type { PreviewImageApiResponse } from "../types";
import PreviewComparisonPanel, {
  type PreviewComparisonRow,
} from "./previewComparisonPanel";

type PreviewModalImage = {
  product_id: number;
  id: number;
  image_file: string;
  description: string;
};

type PreviewModalProps = {
  show: boolean;
  onHide: () => void;
  image: PreviewModalImage;
  RestoreOptimizeImage: () => void;
  size: string;
};

function LoadingSpinner() {
  return (
    <span
      className="inline-block size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
      aria-hidden
    />
  );
}

export default function PreviewModal({
  show,
  onHide,
  image,
  RestoreOptimizeImage,
  size,
}: PreviewModalProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [optimizedUrl, setOptimizedUrl] = useState("");
  const [comparisonRows, setComparisonRows] = useState<PreviewComparisonRow[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await ApiCall("image-optimizer/get-preview-img-data", {
        product_id: image.product_id,
        image_id: image.id,
      });
      const response = raw as PreviewImageApiResponse;
      const parsed = parseProductPreviewData(response.data);

      if (parsed) {
        setOriginalUrl(parsed.originalUrl);
        setOptimizedUrl(parsed.optimizedUrl);
        setComparisonRows([
          {
            label: "Name",
            before: parsed.oldName,
            after: parsed.newName,
          },
          {
            label: "Alt",
            before: parsed.oldAltText,
            after: parsed.newAltText,
          },
          {
            label: "Size",
            before: parsed.oldSizeLabel,
            after: parsed.newSizeLabel,
            savedPercentage: parsed.savedPercentage,
          },
        ]);
        return;
      }

      setOriginalUrl("");
      setOptimizedUrl("");
      setComparisonRows([
        {
          label: "Name",
          before: "—",
          after: image.image_file.split("/").pop() ?? "—",
        },
        {
          label: "Alt",
          before: "—",
          after: image.description || "—",
        },
        { label: "Size", before: "—", after: size },
      ]);
    } finally {
      setLoading(false);
    }
  }, [image.product_id, image.id, image.image_file, image.description, size]);

  useEffect(() => {
    if (show) {
      void loadPreview();
    }
  }, [show, loadPreview]);

  if (!show) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onHide}
      role="presentation"
    >
      <div
        className="relative w-full max-w-xl rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h1 id="preview-modal-title" className="text-sm font-semibold">
            Optimize Preview
          </h1>
          <button
            type="button"
            onClick={onHide}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="mb-1 text-[10px] font-medium uppercase text-gray-400">
                Old
              </p>
              <div className="flex h-[140px] items-center justify-center">
                {loading ? (
                  <LoadingSpinner />
                ) : originalUrl ? (
                  <Image
                    src={originalUrl}
                    width={140}
                    height={140}
                    alt="Original preview"
                    className="max-h-[140px] w-auto object-contain"
                    unoptimized
                  />
                ) : null}
              </div>
            </div>
            <div className="text-center">
              <p className="mb-1 text-[10px] font-medium uppercase text-gray-400">
                New
              </p>
              <div className="flex h-[140px] items-center justify-center">
                {loading ? (
                  <LoadingSpinner />
                ) : optimizedUrl ? (
                  <Image
                    src={optimizedUrl}
                    width={140}
                    height={140}
                    alt="Optimized preview"
                    className="max-h-[140px] w-auto object-contain"
                    unoptimized
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-2">
            <PreviewComparisonPanel rows={comparisonRows} loading={loading} />
          </div>
        </div>

        <div className="flex justify-end border-t px-3 py-2">
          <button
            type="button"
            className="custom-btn !text-xs"
            onClick={() => {
              RestoreOptimizeImage();
              onHide();
            }}
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  );
}
