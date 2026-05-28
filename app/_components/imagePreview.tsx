"use client";

import { useEffect, useState } from "react";
import ReactCompareImage from "react-compare-image";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  open?: boolean;
  onClose?: () => void;
  beforeLabel?: string;
  afterLabel?: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white p-3 shadow-xl sm:p-4">
        <button
          type="button"
          onClick={close}
          className="absolute top-2.5 right-2.5 z-10 text-gray-500 hover:text-black"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="mb-2 pr-8 text-base font-semibold sm:text-lg">
          Original vs Optimized
        </h2>

        <div
          className="image-compare-root relative h-[min(300px,46vh)] shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-[min(340px,50vh)]"
          style={{ touchAction: "none" }}
        >
          {loadError ? (
            <p className="flex h-full items-center justify-center px-4 text-center text-sm text-red-600">
              Could not load images for comparison.
            </p>
          ) : !imagesReady ? (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <span className="inline-block size-7 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              <p className="text-sm text-gray-600">Preparing comparison…</p>
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
              handleSize={36}
              hover={false}
              skeleton={
                <div className="h-full w-full animate-pulse bg-gray-200" />
              }
            />
          )}
        </div>

        <div className="mt-2 flex justify-between gap-2 truncate text-xs text-gray-500 sm:text-sm">
          <span className="truncate">{beforeLabel}</span>
          <span className="truncate text-right">{afterLabel}</span>
        </div>
      </div>
    </div>
  );
}
