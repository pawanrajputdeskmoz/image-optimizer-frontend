"use client";

import PreviewComparisonPanel, {
  type PreviewComparisonRow,
} from "@/app/(bigCommerce)/dashboard/_components/previewComparisonPanel";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  open?: boolean;
  onClose?: () => void;
  beforeLabel?: string;
  afterLabel?: string;
  comparisonRows?: PreviewComparisonRow[];
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
  const [position, setPosition] = useState(50);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

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
    setPosition(50);

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

  const updatePositionFromClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      updatePositionFromClientX(event.clientX);
    },
    [updatePositionFromClientX],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updatePositionFromClientX(event.clientX);
    },
    [updatePositionFromClientX],
  );

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

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
            <div
              ref={trackRef}
              className="relative h-full w-full cursor-ew-resize select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(position)}
              aria-label="Image comparison slider"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  setPosition((prev) => Math.max(0, prev - 2));
                } else if (event.key === "ArrowRight") {
                  setPosition((prev) => Math.min(100, prev + 2));
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={afterSrc}
                alt={afterLabel}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={beforeSrc}
                  alt={beforeLabel}
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              <div
                className="absolute inset-y-0 z-10 w-0.5 bg-white"
                style={{ left: `${position}%`, transform: "translateX(-50%)" }}
              >
                <div className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/40 shadow" />
              </div>
              <span className="absolute top-2 left-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {beforeLabel}
              </span>
              <span className="absolute top-2 right-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {afterLabel}
              </span>
            </div>
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
