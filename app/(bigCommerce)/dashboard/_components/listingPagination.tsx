"use client";

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
  perPageLabel = "Per page",
}: ListingPaginationProps) {
  const [pageInput, setPageInput] = useState(String(currentPage));
  const perPageSelectId = useId();
  const pageJumpId = useId();
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
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <span>
          Page {currentPage} of {totalPages}
        </span>

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
              className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || controlsDisabled}
          className="rounded border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages || controlsDisabled}
          className="rounded border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>

        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <label htmlFor={pageJumpId} className="whitespace-nowrap">
            Go to
          </label>
          <input
            id={pageJumpId}
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitJump();
            }}
            disabled={controlsDisabled}
            className="w-16 rounded border border-gray-300 px-2 py-1.5 text-center text-sm outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Page number"
          />
          <button
            type="button"
            onClick={submitJump}
            disabled={controlsDisabled}
            className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
