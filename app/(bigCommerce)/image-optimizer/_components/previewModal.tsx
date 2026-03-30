"use client";

import { Api } from "@/app/_api/apiCall";
import { useEffect, useState } from "react";
import Spinner from "@/app/_components/ui/Spinner";

type ImageRow = Record<string, unknown>;

type PreviewModalProps = {
  show: boolean;
  onHide: () => void;
  image: ImageRow;
  size: string;
};

export default function Previewmodal({
  show,
  onHide,
  image,
  size,
}: PreviewModalProps) {
  const [oldData, setOldData] = useState({
    image: "",
    name: "",
    size: "",
    altText: "",
  });
  const [shop] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (localStorage.getItem("shop") ?? ""),
  );
  const [loading, setLoading] = useState(false);

  const getPreviewImgData = () => {
    setLoading(true);
    Api("imageOptimizer/getPreviewImgData", {
      product_id: image.product_id,
      image_id: image.id,
    }).then((res: unknown) => {
      if (
        typeof res === "object" &&
        res !== null &&
        "error" in res &&
        typeof (res as { error: unknown }).error === "string"
      ) {
        setLoading(false);
        return;
      }
      const body = res as {
        data?: {
          image_url?: string;
          old_file_name?: string;
          image_size?: string;
          old_alt_text?: string;
        };
      };
      const d = body.data;
      setOldData({
        image: d?.image_url ?? "",
        name: d?.old_file_name ?? "",
        size: d?.image_size ?? "",
        altText: d?.old_alt_text ?? "",
      });
      setLoading(false);
    });
  };

  const imageFile = String(image.image_file ?? "");
  const description = String(image.description ?? "");

  useEffect(() => {
    if (show) queueMicrotask(() => getPreviewImgData());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch on open
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-900">
            Optimize Preview
          </h2>
          <button
            type="button"
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
            aria-label="Close"
            onClick={onHide}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <div className="text-center md:border-r md:pr-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-800">Old</h3>
            <div className="flex items-center justify-center">
              {loading ? (
                <Spinner />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- dynamic preview URL from API */}
                  <img
                    src={oldData.image}
                    width={210}
                    height={210}
                    alt=""
                    className="rounded-lg border"
                  />
                </>
              )}
            </div>
            <ul className="mt-3 space-y-1 text-left text-xs text-zinc-600">
              <li>
                <span className="font-semibold text-zinc-700">Name:</span>{" "}
                {loading ? <Spinner size="sm" /> : oldData.name}
              </li>
              <li>
                <span className="font-semibold text-zinc-700">Size:</span>{" "}
                {loading ? <Spinner size="sm" /> : oldData.size}
              </li>
              <li>
                <span className="font-semibold text-zinc-700">Alt Text:</span>{" "}
                {loading ? <Spinner size="sm" /> : oldData.altText}
              </li>
            </ul>
          </div>

          <div className="text-center">
            <h3 className="mb-3 text-sm font-semibold text-zinc-800">New</h3>
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- BigCommerce store image URL */}
              <img
                src={`https://store-${shop}.mybigcommerce.com/product_images/${imageFile}`}
                width={210}
                height={210}
                alt=""
                className="rounded-lg border"
              />
            </div>
            <ul className="mt-3 space-y-1 text-left text-xs text-zinc-600">
              <li>
                <span className="font-semibold text-zinc-700">Name:</span>{" "}
                {imageFile.split("/").pop()}
              </li>
              <li>
                <span className="font-semibold text-zinc-700">Size:</span> {size}
              </li>
              <li>
                <span className="font-semibold text-zinc-700">Alt Text:</span>{" "}
                {description}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <button
            type="button"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            onClick={onHide}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
