"use client";

import { useMemo, useState } from "react";

type ImageItem = {
  id: number;
  url: string;
  fileName: string;
  alt: string;
  size: string;
  optimized?: boolean;
};

type Product = {
  id: number;
  name: string;
  images: ImageItem[];
};

const productsData: Product[] = [
  {
    id: 1,
    name: "Test Product 1",
    images: [
      {
        id: 1,
        url: "https://via.placeholder.com/60",
        fileName: "image1.png",
        alt: "Alt text 1",
        size: "54 KB",
      },
      {
        id: 2,
        url: "https://via.placeholder.com/60",
        fileName: "image2.png",
        alt: "Alt text 2",
        size: "42 KB",
      },
    ],
  },
  {
    id: 2,
    name: "Test Product 2",
    images: [
      {
        id: 3,
        url: "https://via.placeholder.com/60",
        fileName: "image3.png",
        alt: "Alt text 3",
        size: "128 KB",
      },
    ],
  },
];

export default function DashboardPage() {
  const [products] = useState(productsData);
  const [openProduct, setOpenProduct] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedImages, setSelectedImages] = useState(() =>
    initialSelectedByProduct(productsData)
  );

  const limit = 5;

  // 🔍 SEARCH
  const filteredProducts = useMemo(() => {
    if (!searchKeyword) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [products, searchKeyword]);

  // 📄 PAGINATION
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / limit)
  );

  const page = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredProducts.slice(start, start + limit);
  }, [filteredProducts, page]);

  // 🔽 ACCORDION (normalize id so string API ids still match)
  const toggleAccordion = (id: number | string) => {
    const n = Number(id);
    if (Number.isNaN(n)) return;
    setOpenProduct((prev) => (prev === n ? null : n));
  };

  // 🎯 SELECT IMAGE
  const selectImage = (productId: number, img: ImageItem) => {
    setSelectedImages((prev) => ({ ...prev, [productId]: img }));
  };

  // ✏️ UPDATE ALT
  const updateAltText = (productId: number, value: string) => {
    setSelectedImages((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        alt: value,
      },
    }));
  };

  // ⚡ OPTIMIZE
  const optimizeImage = (productId: number) => {
    setSelectedImages((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        optimized: true,
      },
    }));
  };

  // 🔁 PAGINATION
  const goTo = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(next);
  };

  return (
    <div className="relative z-20 min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="rounded-2xl bg-white p-4 shadow-lg sm:p-6">

        {/* HEADER */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold">Image Optimizer</h1>
          <button
            type="button"
            className="w-full shrink-0 rounded bg-black px-4 py-2 text-sm text-white sm:w-auto"
          >
            Save Alt Text
          </button>
        </div>

        {/* SEARCH */}
        <input
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="Search product..."
          className="border px-3 py-2 rounded mb-4 w-full md:w-64"
        />

        {/* PRODUCT LIST */}
        <div className="space-y-4">
          {paginatedProducts.map((product) => {
            const pid = Number(product.id);
            const isOpen = openProduct === pid;
            return (
            <div
              key={pid}
              className="overflow-hidden rounded-xl border bg-white shadow-sm"
            >
              {/* TOP ROW — stacks on small screens; single row from lg */}
              <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-3">
                {/* Row 1 (mobile) / left block (lg): chevron + name + thumb */}
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label={
                      isOpen
                        ? "Collapse product images"
                        : "Expand product images"
                    }
                    onPointerDown={(e) => {
                      // BigCommerce embedded iframe sometimes drops click events.
                      // Handle pointer-down to make accordion consistently toggle.
                      e.preventDefault();
                      toggleAccordion(pid);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleAccordion(pid);
                      }
                    }}
                    className="relative z-10 inline-flex size-10 shrink-0 touch-manipulation items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                  >
                    {/* Collapsed: points right (›). Open: points down (∨). */}
                    <ChevronDown
                      className={`pointer-events-none size-5 shrink-0 text-zinc-600 transition-transform duration-200 ease-out ${
                        isOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                  </button>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium lg:w-44 lg:flex-none xl:w-48">
                    {product.name}
                  </p>
                  <img
                    src={selectedImages[product.id]?.url}
                    alt={selectedImages[product.id]?.alt || ""}
                    className="size-10 shrink-0 rounded object-cover"
                  />
                </div>

                {/* Fields: full width when stacked; share row on md+ */}
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    readOnly
                    value={selectedImages[product.id]?.fileName || ""}
                    placeholder="File name"
                    className="w-full min-w-0 rounded border px-2 py-2 text-xs sm:flex-1 lg:max-w-[11rem] lg:py-1.5"
                  />
                  <input
                    value={selectedImages[product.id]?.alt || ""}
                    onChange={(e) =>
                      updateAltText(product.id, e.target.value)
                    }
                    placeholder="Alt text"
                    className="w-full min-w-0 rounded border px-2 py-2 text-xs sm:flex-1 lg:max-w-md lg:py-1.5"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 lg:ml-auto lg:shrink-0">
                  <button
                    type="button"
                    onClick={() => optimizeImage(product.id)}
                    className="rounded bg-black px-3 py-2 text-xs text-white lg:py-1"
                  >
                    {selectedImages[product.id]?.optimized
                      ? "Optimized"
                      : "Optimize"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      selectImage(product.id, product.images[0])
                    }
                    className="rounded bg-gray-200 px-3 py-2 text-xs lg:py-1"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* ACCORDION — expands below row, larger nested image cards */}
              {isOpen && (
                <div className="border-t border-zinc-200 bg-gradient-to-b from-zinc-50 to-zinc-100/90 px-5 py-6 md:px-8 md:py-8">
                  <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Product images · {product.images.length}{" "}
                    {product.images.length === 1 ? "file" : "files"}
                  </p>

                  <div className="space-y-5">
                    {product.images.map((img) => {
                      const isSelected =
                        selectedImages[product.id]?.id === img.id;
                      return (
                        <div
                          key={img.id}
                          className={`flex flex-col gap-5 rounded-2xl border-2 bg-white p-5 shadow-md transition-colors md:flex-row md:items-stretch md:gap-6 md:p-6 ${
                            isSelected
                              ? "border-blue-500 ring-2 ring-blue-100"
                              : "border-zinc-200 hover:border-zinc-300"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              selectImage(product.id, img)
                            }
                            className="group shrink-0 self-center md:self-start"
                            aria-pressed={isSelected}
                            aria-label={`Select image ${img.fileName}`}
                          >
                            <img
                              src={img.url}
                              alt={img.alt || "Product image"}
                              className="size-28 rounded-xl border border-zinc-200 object-cover shadow-sm transition group-hover:ring-2 group-hover:ring-zinc-300 md:size-36"
                            />
                            {isSelected && (
                              <span className="mt-2 block text-center text-xs font-medium text-blue-600">
                                Selected for row above
                              </span>
                            )}
                          </button>

                          <div className="min-w-0 flex-1 space-y-4">
                            <ImageDetailField
                              label="File name"
                              value={img.fileName}
                            />
                            <ImageDetailField
                              label="Alt text"
                              value={img.alt}
                            />
                            <ImageDetailField
                              label="File size"
                              value={img.size}
                            />
                            <div className="flex flex-wrap gap-2 pt-1">
                              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600">
                                ID #{img.id}
                              </span>
                              {img.optimized ? (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                                  Optimized
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">
                                  Not optimized
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-row gap-2 md:flex-col md:justify-center">
                            <button
                              type="button"
                              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                selectImage(
                                  product.id,
                                  product.images[0]
                                )
                              }
                              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                            >
                              Use first
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>Page {page} of {totalPages}</span>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              className="rounded border px-3 py-1.5"
            >
              Prev
            </button>

            <button
              type="button"
              onClick={() => goTo(page + 1)}
              className="rounded border px-3 py-1.5"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function initialSelectedByProduct(
  list: Product[]
): Record<number, ImageItem> {
  const map: Record<number, ImageItem> = {};
  for (const p of list) {
    if (p.images[0]) map[p.id] = p.images[0];
  }
  return map;
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ImageDetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="break-all text-sm leading-relaxed text-zinc-900 md:text-base">
        {value || "—"}
      </p>
    </div>
  );
}