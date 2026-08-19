"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useState } from "react";

type ListingPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
  perPage?: number;
  perPageOptions?: number[];
  onPerPageChange?: (perPage: number) => void;
  perPageLabel?: string;
  totalItems?: number;
  itemLabel?: string;
};

export default function ListingPagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className = "",
  perPage,
  perPageOptions,
  onPerPageChange,
  perPageLabel = "per page",
  totalItems,
  itemLabel = "items",
}: ListingPaginationProps) {
  const [pageInput, setPageInput] = useState(String(currentPage));
  const perPageSelectId = useId();
  const showPerPage =
    typeof perPage === "number" &&
    Array.isArray(perPageOptions) &&
    perPageOptions.length > 0 &&
    typeof onPerPageChange === "function";

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const goToPage = (page: number) => {
    onPageChange(Math.min(Math.max(1, page), totalPages));
  };

  const submitJump = () => {
    const parsed = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(currentPage));
      return;
    }
    goToPage(parsed);
  };

  const controlsDisabled = disabled || totalPages <= 1;

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 text-sm text-[#616161] ${className}`.trim()}
    >
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-[#D1D1D1] bg-white text-[#303030] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitJump();
          }}
          onBlur={submitJump}
          disabled={controlsDisabled}
          className="io-input w-12 !h-8 !px-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
          aria-label="Page number"
        />
        <span>
          / {totalPages}
          {typeof totalItems === "number" ? (
            <>
              {" "}
              of {totalItems} {itemLabel}
            </>
          ) : null}
        </span>
      </div>

      {showPerPage ? (
        <div className="flex items-center gap-1.5">
          <label htmlFor={perPageSelectId} className="whitespace-nowrap">
            {perPageLabel}
          </label>
          <select
            id={perPageSelectId}
            value={perPage}
            disabled={disabled}
            onChange={(e) => {
              const next = Number.parseInt(e.target.value, 10);
              if (!Number.isFinite(next) || next === perPage) return;
              onPerPageChange(next);
            }}
            className="io-input !h-8 !py-0 w-16"
            aria-label={perPageLabel}
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-[#D1D1D1] bg-white text-[#303030] hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
