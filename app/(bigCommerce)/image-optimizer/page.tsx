"use client";

import { Api } from "@/app/_api/apiCall";
import ChannelList from "@/app/_components/channelList";
import Howitwork from "@/app/_howitwork/modal";
import { useCallback, useEffect, useRef, useState } from "react";
import Spinner from "@/app/_components/ui/Spinner";
import { basePath } from "@/app/lib/basePath";
import Image from "next/image";
import Upgrade from "@/app/_components/upgradeButton";
import Singleimage from "./_components/singleImage";
import { toast } from "sonner";
import ConfirmModal from "@/app/_components/confirmation";
import Hamburger from "@/app/_components/hamburger";
import ImageModal, { type ImageModalRef } from "./_components/imageModal";
import Previewmodal from "./_components/previewModal";

type ListRow = Record<string, unknown>[];

function isApiError(data: unknown): data is { error: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  );
}

function getStatusCode(data: unknown): number | undefined {
  if (typeof data === "object" && data !== null && "status_code" in data) {
    const v = (data as { status_code: unknown }).status_code;
    return typeof v === "number" ? v : undefined;
  }
  return undefined;
}

function getMessage(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && "message" in data) {
    const v = (data as { message: unknown }).message;
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

function ListPagination({
  total,
  limit,
  currentPage,
  onPageChange,
  onLimitChange: _onLimitChange,
}: {
  total: number;
  limit: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
}) {
  const safeTotal = Math.max(0, total);
  const totalPages = Math.max(1, Math.ceil(safeTotal / Math.max(1, limit)));
  const page = Math.min(Math.max(currentPage, 1), totalPages);

  const start = safeTotal === 0 ? 0 : (page - 1) * limit + 1;
  const end = safeTotal === 0 ? 0 : Math.min(safeTotal, page * limit);

  const pagesToShow = Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1);

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <div className="text-sm text-zinc-600">
        Showing {start} to {end} of {safeTotal} items
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>

        <div className="flex items-center gap-1">
          {pagesToShow.map((p) => (
            <button
              key={p}
              type="button"
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function ImageOptimizerPage() {
  const [imageList, setImageList] = useState<{
    data: ListRow[];
    loading: boolean;
  }>({ data: [], loading: true });
  const [quota, setQuota] = useState({
    used: 0,
    limit: 0,
    optimizedImage: 0,
    inProgressImage: 0,
    restoredImage: 0,
  });
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(4);
  const [masterCheckbox, setMasterCheckbox] = useState(false);
  const filter = "all";
  const [searchKeyword, setSearchKeyword] = useState("");
  const [updatedAltText, setUpdatedAltText] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [updateAltTextBtnLoading, setUpdateAltTextBtnLoading] = useState(false);
  const [checkedImage, setCheckedImage] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [masterButtonLoading, setMasterButtonLoading] = useState(false);
  const [allProductButton, setAllProductButton] = useState(false);
  const [optimizeConfirmModalShow, setOptimizeConfirmModalShow] =
    useState(false);
  const [restoreConfirmModalShow, setRestoreConfirmModalShow] = useState(false);
  const [jobStatus, setJobStatus] = useState(false);
  const [jobStatusLoad, setJobStatusLoad] = useState(false);

  const imageModalRef = useRef<ImageModalRef>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preview, setPreview] = useState<{
    image: Record<string, unknown>;
    size: string;
  } | null>(null);

  const fetchList = useCallback(
    (pageLink: number, kw: string) => {
      setImageList((s) => ({ ...s, loading: true }));
      Api("/image-optimizer/getImageList", {
        filter_type: filter,
        page_link: pageLink,
        search_keyword: kw,
        limit,
      }).then((data: unknown) => {
        if (isApiError(data)) {
          toast.error(data.error);
          setImageList({ data: [], loading: false });
          setTotal(0);
          return;
        }
        const payload = data as {
          data?: ListRow[];
          totalProductCount?: number;
        };
        setImageList({
          data: Array.isArray(payload.data) ? payload.data : [],
          loading: false,
        });
        setTotal(
          typeof payload.totalProductCount === "number"
            ? payload.totalProductCount
            : 0,
        );
      });
    },
    [filter, limit],
  );

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const delay = searchKeyword ? 400 : 0;
    searchDebounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchList(1, searchKeyword);
    }, delay);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [filter, limit, searchKeyword, fetchList]);

  const updateAltText = () => {
    setUpdateAltTextBtnLoading(true);
    Api("imageOptimizer/updateAltText", {
      alt_data: JSON.stringify(Object.values(updatedAltText)),
    }).then((data: unknown) => {
      setUpdateAltTextBtnLoading(false);
      if (isApiError(data)) {
        toast.error(data.error);
        return;
      }
      toast.success("Your changes are saved.");
    });
  };

  const handleMasterOptimize = () => {
    if (allProductButton) {
      setOptimizeConfirmModalShow(true);
    } else {
      const checkedImageArray = Object.values(checkedImage);
      const filterArray = checkedImageArray.filter(
        (item) => (item as { is_optimize?: number }).is_optimize === 0,
      );
      if (filterArray.length === 0) {
        toast.error("Please select Images.");
      } else {
        setMasterCheckbox(false);
        setMasterButtonLoading(true);
        Api("imageOptimizer/checkboxImageOptimize", {
          bulk_img_data: JSON.stringify(Object.values(checkedImage)),
        }).then((data: unknown) => {
          setMasterButtonLoading(false);
          if (isApiError(data)) {
            toast.error(data.error);
            return;
          }
          const code = getStatusCode(data);
          if (code === 200) {
            setImageList({ data: [], loading: true });
            fetchList(currentPage, searchKeyword);
            toast.success(
              "Your image is queued for optimization. It may take up to a few hours depending on the queue our server has.",
            );
          } else if (code === 202) {
            imageModalRef.current?.openModal();
          } else if (code === 204 || code === 203) {
            toast.error(getMessage(data) ?? "Request failed");
          }
        });
      }
    }
  };

  const handleMasterRestore = () => {
    if (allProductButton) {
      setRestoreConfirmModalShow(true);
    } else {
      const checkedImageArray = Object.values(checkedImage);
      const filterArray = checkedImageArray.filter(
        (item) => (item as { is_optimize?: number }).is_optimize === 1,
      );
      if (filterArray.length === 0) {
        toast.error("Please select Images.");
      } else {
        setMasterCheckbox(false);
        setMasterButtonLoading(true);
        Api("imageOptimizer/checkboxRestoreImage", {
          bulk_img_data: JSON.stringify(Object.values(checkedImage)),
        }).then((data: unknown) => {
          setMasterButtonLoading(false);
          if (isApiError(data)) {
            toast.error(data.error);
            return;
          }
          const code = getStatusCode(data);
          if (code === 200) {
            setImageList({ data: [], loading: true });
            fetchList(currentPage, searchKeyword);
            toast.success(
              "Your image is queued for Restore. It may take up to a few hours depending on the queue our server has.",
            );
          } else if (code === 202) {
            imageModalRef.current?.openModal();
          } else if (code === 204 || code === 203) {
            toast.error(getMessage(data) ?? "Request failed");
          }
        });
      }
    }
  };

  const BulkImageOptimize = () => {
    setAllProductButton(false);
    setMasterCheckbox(false);
    setMasterButtonLoading(true);
    Api("imageOptimizer/BulkImageOptimize").then((data: unknown) => {
      setMasterButtonLoading(false);
      if (isApiError(data)) {
        toast.error(data.error);
        return;
      }
      const code = getStatusCode(data);
      if (code === 200) {
        toast.success(
          "Your image is queued for optimization. It may take up to a few hours depending on the queue our server has.",
        );
      } else if (code === 202) {
        imageModalRef.current?.openModal();
      } else if (code === 204 || code === 203) {
        toast.error(getMessage(data) ?? "Request failed");
      }
    });
  };

  const RestoreBulkOptimizeImage = () => {
    setAllProductButton(false);
    setMasterCheckbox(false);
    setMasterButtonLoading(true);
    Api("imageOptimizer/RestoreBulkOptimizeImage").then((data: unknown) => {
      setMasterButtonLoading(false);
      if (isApiError(data)) {
        toast.error(data.error);
        return;
      }
      const code = getStatusCode(data);
      if (code === 200) {
        toast.success(
          "Your image is queued for Restore. It may take up to a few hours depending on the queue our server has.",
        );
      } else if (code === 202) {
        imageModalRef.current?.openModal();
      } else if (code === 204 || code === 203) {
        toast.error(getMessage(data) ?? "Request failed");
      }
    });
  };

  const getImgJobStatus = () => {
    setJobStatusLoad(true);
    Api("imageOptimizer/getImgJobStatus").then((res: unknown) => {
      setJobStatusLoad(false);
      if (isApiError(res)) return;
      const body = res as { data?: { isJobRunning?: boolean } };
      setJobStatus(!!body.data?.isJobRunning);
    });
  };

  const getImagesCount = () => {
    Api("imageOptimizer/getImagesCount").then((res: unknown) => {
      if (isApiError(res)) return;
      const body = res as {
        data?: {
          total_used_image?: number;
          optimize_limit?: number;
          total_optimized_image?: number;
          total_inprogress_image?: number;
          total_restored_image?: number;
        };
      };
      const d = body.data;
      if (!d) return;
      setQuota({
        used: d.total_used_image ?? 0,
        limit: d.optimize_limit ?? 0,
        optimizedImage: d.total_optimized_image ?? 0,
        inProgressImage: d.total_inprogress_image ?? 0,
        restoredImage: d.total_restored_image ?? 0,
      });
    });
  };

  useEffect(() => {
    queueMicrotask(() => {
      getImgJobStatus();
      getImagesCount();
    });
  }, []);

  const images = (imageList.data as unknown[]).flatMap((group) =>
    Array.isArray(group) ? group : [],
  );

  return (
    <>
      <ConfirmModal
        show={optimizeConfirmModalShow}
        handleClose={() => setOptimizeConfirmModalShow(false)}
        message={
          <>
            <p>
              This process can not be stopped once it gets started. We suggest
              you first optimize some of the images manually before going for
              bulk optimization to check if everything works fine for your
              store.
            </p>
            <p>
              Also, please note that you may need to manage and check with any
              3rd party App/Service you are using for search/display/indexing of
              images.
            </p>
          </>
        }
        handleYes={() => {
          BulkImageOptimize();
          setOptimizeConfirmModalShow(false);
        }}
        handleNo={() => setOptimizeConfirmModalShow(false)}
      />

      <ConfirmModal
        show={restoreConfirmModalShow}
        handleClose={() => setRestoreConfirmModalShow(false)}
        message={
          <>
            <p>
              This process can not be stopped once it gets started. We suggest
              you first restore some of the images manually before going for
              bulk restore to check if everything works fine for your store.
            </p>
            <p>
              Also, please note that you may need to manage and check with any
              3rd party App/Service you are using for search/display/indexing of
              images.
            </p>
          </>
        }
        handleYes={() => {
          RestoreBulkOptimizeImage();
          setRestoreConfirmModalShow(false);
        }}
        handleNo={() => setRestoreConfirmModalShow(false)}
      />

      {preview ? (
        <Previewmodal
          show={true}
          onHide={() => setPreview(null)}
          image={preview.image}
          size={preview.size}
        />
      ) : null}

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              Image Optimizer for BigCommerce
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Optimize your product images effortlessly.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            onClick={() => {
              setImageList({ data: [], loading: true });
              fetchList(1, searchKeyword);
              setCurrentPage(1);
            }}
          >
            Fetch Product Images
          </button>
        </div>

        <div className="hidden">
          <ImageModal ref={imageModalRef} />
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2 border-b border-zinc-200 pb-1">
            <button
              type="button"
              className="pb-3 text-sm font-semibold text-zinc-900 border-b-2 border-blue-600"
            >
              All Images
            </button>
            <button
              type="button"
              className="pb-3 text-sm font-semibold text-zinc-500 hover:text-zinc-900"
            >
              Optimized Images
            </button>
            <button
              type="button"
              className="pb-3 text-sm font-semibold text-zinc-500 hover:text-zinc-900"
              onClick={() => imageModalRef.current?.openModal()}
            >
              Settings
            </button>
            <button
              type="button"
              className="pb-3 text-sm font-semibold text-zinc-500 hover:text-zinc-900"
            >
              Reports
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-5 pb-12">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-600">Filter by:</span>
                <select className="h-10 min-w-44 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900">
                  <option>All Categories</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-600">Image Size:</span>
                <select className="h-10 min-w-40 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900">
                  <option>All Sizes</option>
                </select>
              </div>
            </div>

            <div className="relative w-full max-w-sm">
              <Image
                src={`${basePath}/images/search-icon.svg`}
                width={18}
                height={18}
                alt=""
                className="absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                placeholder="Search products..."
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchKeyword}
                onChange={(e) => {
                  setImageList({ data: [], loading: true });
                  setSearchKeyword(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full border-collapse">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xl font-semibold text-zinc-600">
                    Product
                  </th>
                  <th className="px-5 py-4 text-left text-xl font-semibold text-zinc-600">
                    Original Size
                  </th>
                  <th className="px-5 py-4 text-left text-xl font-semibold text-zinc-600">
                    Optimized Size
                  </th>
                  <th className="px-5 py-4 text-left text-xl font-semibold text-zinc-600">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-xl font-semibold text-zinc-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {imageList.loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <Spinner />
                    </td>
                  </tr>
                ) : images.length > 0 ? (
                  images.map((img, idx) => {
                    const imageAny = img as Record<string, unknown> & {
                      id?: string | number;
                      product_id?: string | number;
                    };
                    const key = `${String(imageAny.product_id ?? "p")}-${String(
                      imageAny.id ?? idx,
                    )}`;
                    return (
                      <Singleimage
                        key={key}
                        image={img}
                        openSettingsModal={() =>
                          imageModalRef.current?.openModal()
                        }
                        onPreview={(payload) => setPreview(payload)}
                      />
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-zinc-600">
                      No product found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <ListPagination
            total={total}
            limit={limit}
            currentPage={currentPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              setImageList({ data: [], loading: true });
              fetchList(page, searchKeyword);
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
            }}
          />

          <div className="mt-10 flex justify-center gap-4 pb-2">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              onClick={() => setOptimizeConfirmModalShow(true)}
            >
              Bulk Optimize
            </button>

            <button
              type="button"
              className="rounded-lg border border-zinc-200 bg-white px-7 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
              onClick={() => imageModalRef.current?.openModal()}
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
