"use client";

import { useCallback, useEffect, useState } from "react";

import { isApiError, isApiFailure } from "../_lib/apiUtils";
import {
  applyContextualOptimizationResult,
  mapApiContextualImages,
} from "../_lib/contextualImageMappers";
import { HOME_CAROUSEL_UPDATE_NOTE } from "../_lib/contextualImageMessages";
import { canOptimizeHomeImage } from "../_lib/homeImageOptimize";
import { fetchHomeImages, optimizeHomeImage } from "../_lib/imageOptimizerApi";
import type { ContextualImage } from "../types";
import ContextualImagePreviewModal from "./contextualImagePreviewModal";
import ContextualImageRow from "./contextualImageRow";

type HomeImageListingProps = {
  refreshNonce?: number;
};

export default function HomeImageListing({
  refreshNonce = 0,
}: HomeImageListingProps) {
  const [images, setImages] = useState<ContextualImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [optimizingKeys, setOptimizingKeys] = useState<Record<string, true>>(
    {},
  );
  const [previewImage, setPreviewImage] = useState<ContextualImage | null>(
    null,
  );

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetchHomeImages(true);

      if (isApiError(response)) {
        setError("Failed to load home images.");
        return;
      }

      if (isApiFailure(response)) {
        setError(response.message || "Failed to load home images.");
        return;
      }

      setImages(mapApiContextualImages(response.data));
      setMessage(response.message ?? null);
    } catch {
      setError("Something went wrong while loading home images.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadImages();
  }, [loadImages, refreshNonce]);

  const handlePreview = useCallback((image: ContextualImage) => {
    setPreviewImage(image);
  }, []);

  const handleOptimize = useCallback(async (image: ContextualImage) => {
    setOptimizingKeys((prev) => ({ ...prev, [image.key]: true }));
    setError(null);

    try {
      const response = await optimizeHomeImage(image);

      if (isApiError(response)) {
        setError("Failed to optimize image.");
        return;
      }

      if (isApiFailure(response)) {
        setError(response.message || "Failed to optimize image.");
        return;
      }

      const result = response.data;
      const isOptimized =
        result?.status === "optimized" ||
        result?.optimization_status === "optimized" ||
        Boolean(result?.optimized_url);

      if (response.success !== true || !isOptimized) {
        setError(response.message || "Failed to optimize image.");
        return;
      }

      setImages((prev) =>
        prev.map((item) =>
          item.key === image.key
            ? applyContextualOptimizationResult(item, result ?? {})
            : item,
        ),
      );
      setMessage(response.message ?? "Image optimized successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while optimizing the image.",
      );
    } finally {
      setOptimizingKeys((prev) => {
        if (!prev[image.key]) {
          return prev;
        }

        const next = { ...prev };
        delete next[image.key];
        return next;
      });
    }
  }, []);

  if (isLoading && images.length === 0) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border bg-gray-50 px-4 py-10 text-sm text-gray-600">
        <span className="inline-block size-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        Loading home images…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading && images.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block size-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          Updating…
        </div>
      ) : null}

      {message && !error ? (
        <p className="text-sm text-gray-600">{message}</p>
      ) : null}

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span className="mr-1 font-semibold text-amber-700">*</span>
        {HOME_CAROUSEL_UPDATE_NOTE}
      </p>

      <div className="rounded-xl border bg-white">
        <div className="h-[560px] overflow-y-auto p-3">
          {images.length === 0 && !isLoading ? (
            <div className="rounded-lg border bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
              No home images found.
            </div>
          ) : (
            <div className="space-y-3">
              {images.map((image) => (
                <ContextualImageRow
                  key={image.key}
                  image={image}
                  isBusy={Boolean(optimizingKeys[image.key])}
                  onOptimize={
                    canOptimizeHomeImage(image) ? handleOptimize : undefined
                  }
                  onPreview={image.isOptimized ? handlePreview : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ContextualImagePreviewModal
        open={previewImage !== null}
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
