"use client";

import Image from "next/image";
import { Eye } from "lucide-react";

import {
  getCategoryOptimizeButtonLabel,
  isCategoryOptimizeDisabled,
} from "../_lib/categoryMappers";
import { CAROUSEL_ROW_NOTE_TITLE } from "../_lib/contextualImageMessages";
import { PLACEHOLDER_IMAGE } from "../_lib/productMappers";
import type { ContextualImage } from "../types";

function isCarouselLimited(image: ContextualImage): boolean {
  return !image.isUpdateSupported && image.sourceType !== "marketing_banner";
}

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
  const carouselLimited = isCarouselLimited(image);
  const isOptimizeDisabled =
    isBusy ||
    !onOptimize ||
    carouselLimited ||
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
      className={`flex items-center gap-3 rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-[#F8FAFC] p-3 transition-all ${
        isSelected
          ? "bg-[#FAFAFA]"
          : ""
      }`}
    >
      {onSelect ? (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(image, e.target.checked)}
          className="size-4 shrink-0 rounded border-gray-300 cursor-pointer"
          aria-label={`Select ${image.fileName}`}
        />
      ) : null}

      <div className="relative shrink-0">
        <Image
          src={image.url || PLACEHOLDER_IMAGE}
          alt={image.fileName}
          width={40}
          height={40}
          unoptimized
          className="size-10 rounded object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-0 flex min-w-0 items-center gap-1.5 text-sm font-medium text-[#303030]">
          {carouselLimited && image.sourceType !== "category" ? (
            <span
              className="shrink-0 font-semibold text-amber-600"
              title={CAROUSEL_ROW_NOTE_TITLE}
              aria-label={CAROUSEL_ROW_NOTE_TITLE}
            >
              *
            </span>
          ) : null}
          <span
            className="truncate text-[13px] font-medium text-[#303030]"
            title={image.fileName}
          >
            {image.fileName}
          </span>
          {image.url && image.url !== PLACEHOLDER_IMAGE ? (
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 text-[#9A9A9A] hover:text-[#303030]"
              title="Open image in new tab"
              aria-label={`Open ${image.fileName} in new tab`}
            >
              <Image
                src="/images/link-icon.svg"
                alt=""
                width={14}
                height={14}
                unoptimized
                className="size-3.5"
              />
            </a>
          ) : null}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex rounded-[8px] bg-[#E0F0FF] px-2 py-0.5 text-xs font-medium text-[#00527C]">
            {image.sizeLabel || "—"}
          </span>
          {subtitle ? (
            <span
              className="inline-flex rounded-[8px] bg-[#F1F1F1] px-2 py-0.5 text-xs font-medium text-[#616161]"
              title={subtitle}
            >
              <span className="truncate max-w-[220px]">{subtitle}</span>
            </span>
          ) : null}
        </div>

        {image.errorMessage ? (
          <p className="mt-1 text-xs text-red-600">{image.errorMessage}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {image.isOptimized && onPreview ? (
          <button
            type="button"
            onClick={() => onPreview(image)}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-[#D1D1D1] bg-white text-[#303030] hover:bg-[#FAFAFA]"
            aria-label="Preview"
            title="Preview"
          >
            <Eye className="size-4" />
          </button>
        ) : null}

        {image.isOptimized && onRestore ? (
          <button
            type="button"
            disabled={isRestoring}
            onClick={() => onRestore(image)}
            className="btn-default"
          >
            {isRestoring ? "Restoring…" : "Restore"}
          </button>
        ) : null}

        {!image.isOptimized ? (
          <button
            type="button"
            disabled={isOptimizeDisabled}
            title={
              image.sourceType === "category" &&
              (image.status === "no_image" || !image.isUpdateSupported)
                ? "No image available for this category"
                : carouselLimited
                  ? CAROUSEL_ROW_NOTE_TITLE
                  : undefined
            }
            onClick={() => onOptimize?.(image)}
            className={`custom-btn ${
              image.sourceType === "category" && image.status === "no_image"
                ? "!bg-[#9a9a9a] !shadow-none"
                : ""
            }`}
          >
            {optimizeButtonLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
