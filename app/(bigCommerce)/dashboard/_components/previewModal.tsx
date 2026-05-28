"use client";

import { ApiCall } from "@/app/_api/apiCall";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { storageFilePathToPublicUrl } from "../_lib/previewFiles";
import type { PreviewImageApiResponse } from "../types";

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

type OldPreviewData = {
  image: string;
  name: string;
  size: string;
  altText: string;
};

type LegacyPreviewResponse = {
  data?: {
    image_url?: string;
    old_file_name?: string;
    image_size?: string;
    old_alt_text?: string;
    files?: { original?: string | null };
    oldData?: {
      imageName?: string;
      altText?: string;
      original?: { size?: number };
    };
  };
};

function readStoredShop(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("shop") ?? "";
}

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
  const [oldData, setOldData] = useState<OldPreviewData>({
    image: "",
    name: "",
    size: "",
    altText: "",
  });
  const [shop] = useState(readStoredShop);
  const [loading, setLoading] = useState(false);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await ApiCall("image-optimizer/get-preview-img-data", {
        product_id: image.product_id,
        image_id: image.id,
      });
      const response = raw as PreviewImageApiResponse & LegacyPreviewResponse;
      const data = response.data;
      setOldData({
        image:
          data?.image_url ??
          storageFilePathToPublicUrl(data?.files?.original) ??
          "",
        name: data?.old_file_name ?? data?.oldData?.imageName ?? "",
        size:
          data?.image_size ??
          (typeof data?.oldData?.original?.size === "number"
            ? `${(data.oldData.original.size / 1024).toFixed(1)} KB`
            : ""),
        altText: data?.old_alt_text ?? data?.oldData?.altText ?? "",
      });
    } finally {
      setLoading(false);
    }
  }, [image.product_id, image.id]);

  useEffect(() => {
    if (show) {
      void loadPreview();
    }
  }, [show, loadPreview]);

  if (!show) {
    return null;
  }

  const optimizedSrc = shop
    ? `https://store-${shop}.mybigcommerce.com/product_images/${image.image_file}`
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onHide}
      role="presentation"
    >
      <div
        className="relative w-full max-w-4xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h1 id="preview-modal-title" className="text-lg font-semibold">
            Optimize Preview
          </h1>
          <button
            type="button"
            onClick={onHide}
            className="text-gray-500 hover:text-black"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="optimizePreview-modalArea grid grid-cols-2 gap-4">
            <div className="optimizePreview-left border-r pr-4 text-center">
              <h2 className="mb-3 text-base font-semibold">Old</h2>
              <div className="OptimizeModal-Image flex min-h-[210px] items-center justify-center">
                {loading ? (
                  <LoadingSpinner />
                ) : oldData.image ? (
                  <Image
                    src={oldData.image}
                    width={210}
                    height={210}
                    alt="Original preview"
                    unoptimized
                  />
                ) : null}
              </div>
              <ul className="mt-3 space-y-1 text-left text-sm">
                <li>
                  <span className="font-medium">Name: </span>
                  {loading ? <LoadingSpinner /> : oldData.name}
                </li>
                <li>
                  <span className="font-medium">Size: </span>
                  {loading ? <LoadingSpinner /> : oldData.size}
                </li>
                <li>
                  <span className="font-medium">Alt Text: </span>
                  {loading ? <LoadingSpinner /> : oldData.altText}
                </li>
              </ul>
            </div>

            <div className="optimizePreview-left pl-4 text-center">
              <h2 className="mb-3 text-base font-semibold">New</h2>
              <div className="OptimizeModal-Image flex min-h-[210px] items-center justify-center">
                {optimizedSrc ? (
                  <Image
                    src={optimizedSrc}
                    width={210}
                    height={210}
                    alt="Optimized preview"
                    unoptimized
                  />
                ) : null}
              </div>
              <ul className="mt-3 space-y-1 text-left text-sm">
                <li>
                  <span className="font-medium">Name: </span>
                  {image.image_file.split("/").pop()}
                </li>
                <li>
                  <span className="font-medium">Size: </span>
                  {size}
                </li>
                <li>
                  <span className="font-medium">Alt Text: </span>
                  {image.description}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t px-4 py-3">
          <button
            type="button"
            className="custom-btn rounded bg-black px-4 py-2 text-sm text-white"
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
