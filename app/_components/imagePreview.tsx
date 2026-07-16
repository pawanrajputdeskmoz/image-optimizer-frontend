"use client";

import PreviewComparisonPanel, {
  type PreviewComparisonRow,
} from "@/app/(bigCommerce)/dashboard/_components/previewComparisonPanel";
import { useEffect, useState } from "react";
import ReactCompareImage from "react-compare-image";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  open?: boolean;
  onClose?: () => void;
  beforeLabel?: string;
  afterLabel?: string;
  comparisonRows?: PreviewComparisonRow[];
};

const imageFitStyle = {
  objectFit: "cover" as const,
  width: "100%",
  height: "100%",
  display: "block",
  pointerEvents: "none" as const,
  userSelect: "none" as const,
};

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

export default function ImageComparePopup({
  beforeSrc,
  afterSrc,
  open = false,
  onClose,
  beforeLabel = "Original",
  afterLabel = "Optimized",
  comparisonRows = [],
}: Props) {
  const [isOpen, setIsOpen] = useState(open);
  const [imagesReady, setImagesReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  useEffect(() => {
    if (!isOpen || !beforeSrc || !afterSrc) {
      setImagesReady(false);
      setLoadError(false);
      return;
    }

    let cancelled = false;
    setImagesReady(false);
    setLoadError(false);

    Promise.all([preloadImage(beforeSrc), preloadImage(afterSrc)])
      .then(() => {
        if (!cancelled) {
          setImagesReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, beforeSrc, afterSrc]);

  if (!isOpen) {
    return null;
  }

  const close = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-3 shadow-xl">
        <button
          type="button"
          onClick={close}
          className="absolute top-2 right-2 z-10 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="mb-2 pr-6 text-sm font-semibold">Original vs Optimized</h2>

        <div
          className="image-compare-root relative h-[min(220px,38vh)] overflow-hidden rounded-md bg-gray-100"
          style={{ touchAction: "none" }}
        >
          {loadError ? (
            <p className="flex h-full items-center justify-center px-3 text-center text-xs text-red-600">
              Could not load images for comparison.
            </p>
          ) : !imagesReady ? (
            <div className="flex h-full flex-col items-center justify-center gap-1.5">
              <span className="inline-block size-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              <p className="text-xs text-gray-500">Loading…</p>
            </div>
          ) : (
            <ReactCompareImage
              leftImage={beforeSrc}
              rightImage={afterSrc}
              leftImageLabel={beforeLabel}
              rightImageLabel={afterLabel}
              leftImageCss={imageFitStyle}
              rightImageCss={imageFitStyle}
              aspectRatio="wider"
              sliderLineColor="#ffffff"
              sliderLineWidth={2}
              handleSize={30}
              hover={false}
              skeleton={
                <div className="h-full w-full animate-pulse bg-gray-200" />
              }
            />
          )}
        </div>

        {comparisonRows.length > 0 && (
          <div className="mt-2">
            <PreviewComparisonPanel rows={comparisonRows} />
          </div>
        )}
      </div>
    </div>
  );
}
