"use client";

import { basePath } from "@/app/lib/basePath";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Api } from "@/app/_api/apiCall";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Spinner from "@/app/_components/ui/Spinner";

type ImageRow = Record<string, unknown>;

export default function Singleimage({
  image,
  openSettingsModal,
  onPreview,
}: {
  image: ImageRow;
  openSettingsModal?: () => void;
  onPreview: (payload: { image: ImageRow; size: string }) => void;
}) {
  const router = useRouter();

  const imageFile = String(image.image_file ?? "");
  const description = String(image.description ?? "");
  const urlThumb = String(image.url_thumbnail ?? "");

  const [altText] = useState(description);
  const [optimizeStatus, setOptimizeStatus] = useState(
    Number(image.is_optimize ?? 0),
  );
  const [originalSize, setOriginalSize] = useState("");
  const [optimizedSize, setOptimizedSize] = useState("");

  const getImageStatus = () => {
    Api("imageOptimizer/getImagesStatus", {
      image_id: image.id,
      product_id: image.product_id,
      image_url: imageFile,
    }).then((data: unknown) => {
      if (
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
      ) {
        setOptimizeStatus(0);
        setOriginalSize("> 1MB");
        setOptimizedSize("");
        return;
      }
      const d = data as { status_code?: number; data?: { status?: number; image_size?: string } };
      if (d.status_code === 200 && d.data) {
        setOptimizeStatus(d.data.status ?? 0);
        const original = d.data.image_size ?? "";
        const optimizedRaw =
          (d.data as Record<string, unknown>).optimized_image_size ??
          (d.data as Record<string, unknown>).optimized_size ??
          (d.data as Record<string, unknown>).optimizedImageSize ??
          "";
        const optimized =
          typeof optimizedRaw === "string" || typeof optimizedRaw === "number"
            ? String(optimizedRaw)
            : "";
        setOriginalSize(original);
        setOptimizedSize(String(optimized || ""));
      } else {
        setOptimizeStatus(0);
        setOriginalSize("> 1MB");
        setOptimizedSize("");
      }
    });
  };

  useEffect(() => {
    getImageStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch for this row
  }, []);

  const imageOptimize = () => {
    setOptimizeStatus(5);
    Api("imageOptimizer/imageOptimize", {
      img_alt: altText,
      old_alt_text: description,
      img_name: imageFile.split("/").pop(),
      real_image: imageFile,
      product_id: image.product_id,
      image_id: image.id,
      is_thumbnail: image.is_thumbnail,
      sort_order: image.sort_order,
    }).then((data: unknown) => {
      const err =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : null;
      if (err) {
        setOptimizeStatus(0);
        toast.error(err);
        return;
      }
      const code = (data as { status_code?: number }).status_code;
      if (code === 202) {
        setOptimizeStatus(0);
        if (openSettingsModal) openSettingsModal();
        else router.push("/image-optimizer-setting");
      }
      if (code === 200) {
        setOptimizeStatus(2);
        toast.success(
          "Your image is queued for optimization. It may take up to a few hours depending on the queue our server has.",
        );
      }
      if (code === 204 || code === 203) {
        setOptimizeStatus(0);
        toast.error(String((data as { message?: string }).message ?? "Error"));
      }
    });
  };

  const RestoreOptimizeImage = () => {
    setOptimizeStatus(5);
    Api("imageOptimizer/RestoreOptimizeImage", {
      product_id: image.product_id,
      image_id: image.id,
    }).then((data: unknown) => {
      const err =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : null;
      if (err) {
        setOptimizeStatus(1);
        toast.error(err);
        return;
      }
      const code = (data as { status_code?: number }).status_code;
      if (code === 204 || code === 203) {
        setOptimizeStatus(1);
        toast.error(String((data as { message?: string }).message ?? "Error"));
      }
      if (code === 200) {
        setOptimizeStatus(3);
        toast.success(
          "Your image is queued for restore. It may take up to a few hours depending on the queue our server has.",
        );
      }
    });
  };

  const fileName = imageFile ? imageFile.split("/").pop() ?? "" : "";

  const status =
    optimizeStatus === 0
      ? { label: "Not Optimized", color: "text-zinc-700", dot: "bg-zinc-500" }
      : optimizeStatus === 1
        ? { label: "Optimized", color: "text-emerald-700", dot: "bg-emerald-600" }
        : optimizeStatus === 2
          ? { label: "Optimizing", color: "text-sky-700", dot: "bg-sky-600" }
          : optimizeStatus === 3
            ? { label: "Restoring", color: "text-amber-700", dot: "bg-amber-600" }
            : { label: "Queued", color: "text-zinc-700", dot: "bg-zinc-500" };

  const isBusy = optimizeStatus === 2 || optimizeStatus === 3 || optimizeStatus === 5;

  const canOptimize = optimizeStatus === 0;
  const canRevert = optimizeStatus === 1;

  return (
    <tr className="border-t border-zinc-200">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded border border-zinc-200 bg-white">
            {imageFile ? (
              // eslint-disable-next-line @next/next/no-img-element -- thumbnail url from API
              <img
                src={urlThumb || imageFile}
                width={40}
                height={40}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={`${basePath}/images/noimage.svg`}
                width={22}
                height={22}
                alt=""
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium leading-5 text-zinc-900">
              {fileName || "—"}
            </div>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-zinc-700">
        {originalSize || "—"}
      </td>

      <td className="px-5 py-4 text-sm text-zinc-700">
        {canRevert ? optimizedSize || "—" : "—"}
      </td>

      <td className="px-5 py-4 text-sm">
        <div className={`inline-flex items-center gap-2 font-medium ${status.color}`}>
          {canRevert ? (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M16.5 5.5L8.5 13.5L4 9" />
            </svg>
          ) : (
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          )}
          {status.label}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {canOptimize ? (
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              disabled={!imageFile || isBusy}
              onClick={imageOptimize}
            >
              Optimize
            </button>
          ) : optimizeStatus === 2 || optimizeStatus === 5 ? (
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white opacity-60"
              disabled
            >
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" /> Optimizing
              </span>
            </button>
          ) : null}

          {canRevert ? (
            <button
              type="button"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
              onClick={RestoreOptimizeImage}
              disabled={isBusy}
            >
              Revert
            </button>
          ) : optimizeStatus === 3 ? (
            <button
              type="button"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 opacity-60"
              disabled
            >
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" /> Restoring
              </span>
            </button>
          ) : null}

          <button
            type="button"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            onClick={() => onPreview({ image, size: optimizedSize || originalSize || "" })}
            disabled={!imageFile || isBusy}
          >
            Preview
          </button>
        </div>
      </td>
    </tr>
  );
}
