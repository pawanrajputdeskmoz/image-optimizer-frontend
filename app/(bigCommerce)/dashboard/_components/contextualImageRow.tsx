"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";

import {
  getCategoryOptimizeButtonLabel,
  isCategoryOptimizeDisabled,
} from "../_lib/categoryMappers";
import { CAROUSEL_ROW_NOTE_TITLE } from "../_lib/contextualImageMessages";
import { PLACEHOLDER_IMAGE } from "../_lib/productMappers";
import type { ContextualImage } from "../types";

type ContextualImageRowProps = {
  image: ContextualImage;
  isSelected?: boolean;
  isBusy?: boolean;
  isRestoring?: boolean;
  onSelect?: (image: ContextualImage, checked: boolean) => void;
  onOptimize?: (image: ContextualImage) => void;
  onRestore?: (image: ContextualImage) => void;
  onPreview?: (image: ContextualImage) => void;
};

function buildSubtitle(image: ContextualImage): string {
  const parts = [image.sourceName, image.context].filter(Boolean);
  return parts.join(" · ");
}

export default function ContextualImageRow({
  image,
  isSelected = false,
  isBusy = false,
  isRestoring = false,
  onSelect,
  onOptimize,
  onRestore,
  onPreview,
}: ContextualImageRowProps) {
  const subtitle = buildSubtitle(image);
  const usesCategoryStatus = image.sourceType === "category" && image.status;
  const categoryStatus = image.status ?? "pending";
  const isCategoryOptimizedState = usesCategoryStatus
    ? isCategoryOptimizeDisabled(categoryStatus)
    : image.isOptimized;
  const isOptimizeDisabled =
    isBusy ||
    !onOptimize ||
    !image.isUpdateSupported ||
    (usesCategoryStatus
      ? isCategoryOptimizeDisabled(categoryStatus)
      : image.isOptimized);
  const optimizeButtonLabel = usesCategoryStatus
    ? getCategoryOptimizeButtonLabel(categoryStatus, isBusy)
    : image.isOptimized
      ? "Optimized"
      : isBusy
        ? "Optimizing…"
        : "Optimize";

  return (
    <div
      className={`flex items-center gap-4 rounded border p-3 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-100"
          : "bg-white"
      }`}
    >
      {onSelect ? (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(image, e.target.checked)}
          className="size-4 shrink-0 cursor-pointer accent-black"
          aria-label={`Select ${image.fileName}`}
        />
      ) : null}

      <div className="relative shrink-0">
        <Image
          src={image.url || PLACEHOLDER_IMAGE}
          alt={image.fileName}
          width={56}
          height={56}
          unoptimized
          className="size-14 rounded object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {!image.isUpdateSupported && image.sourceType !== "category" ? (
            <span
              className="shrink-0 font-semibold text-amber-600"
              title={CAROUSEL_ROW_NOTE_TITLE}
              aria-label={CAROUSEL_ROW_NOTE_TITLE}
            >
              *
            </span>
          ) : null}
          <span className="truncate">{image.fileName}</span>
          {image.url && image.url !== PLACEHOLDER_IMAGE ? (
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 text-gray-400 hover:text-gray-700"
              title="Open image in new tab"
              aria-label={`Open ${image.fileName} in new tab`}
            >
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
          <span className="shrink-0 font-normal text-gray-500">
            {image.sizeLabel}
          </span>
        </p>

        {subtitle ? (
          <p className="mt-1 truncate text-sm text-gray-600">{subtitle}</p>
        ) : null}

        {image.errorMessage ? (
          <p className="mt-1 text-xs text-red-600">{image.errorMessage}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-2">
        {image.isOptimized && onPreview ? (
          <button
            type="button"
            onClick={() => onPreview(image)}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Preview
          </button>
        ) : null}

        <button
          type="button"
          disabled={isOptimizeDisabled}
          title={
            image.sourceType === "category" &&
            (image.status === "no_image" || !image.isUpdateSupported)
              ? "No image available for this category"
              : !image.isUpdateSupported && !image.isOptimized
                ? CAROUSEL_ROW_NOTE_TITLE
                : undefined
          }
          onClick={() => onOptimize?.(image)}
          className={`rounded px-3 py-2 text-sm text-white disabled:cursor-not-allowed ${
            image.sourceType === "category" && image.status === "no_image"
              ? "bg-gray-400 opacity-80"
              : isCategoryOptimizedState
                ? "bg-emerald-700 opacity-90"
                : "bg-black disabled:opacity-50"
          }`}
        >
          {optimizeButtonLabel}
        </button>

        {image.isOptimized && onRestore ? (
          <button
            type="button"
            disabled={isRestoring}
            onClick={() => onRestore(image)}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRestoring ? "Restoring…" : "Restore"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
