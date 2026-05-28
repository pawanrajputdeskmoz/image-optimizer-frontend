import { basePath } from "@/app/lib/basePath";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ApiCall } from "@/app/_api/apiCall";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Previewmodal from "./previewModal";

type LegacyImage = {
  id: number;
  product_id: number;
  description: string;
  image_file: string;
  url_thumbnail: string;
  url: string;
  is_optimize?: number;
  is_thumbnail: boolean;
  sort_order: number;
};

type CheckedPayload = {
  img_alt: string;
  old_alt_text: string;
  img_name: string | undefined;
  real_image: string;
  product_id: number;
  image_id: number;
  is_thumbnail: boolean;
  sort_order: number;
  is_optimize: number;
};

type ApiRes = { status_code?: number; data?: { status?: number; image_size?: string }; message?: string };

function readChannelDomain(): string {
  if (typeof window === "undefined") return "";
  try {
    return (JSON.parse(localStorage.getItem("channel") ?? "{}") as { domain?: string }).domain ?? "";
  } catch {
    return "";
  }
}

function LoadingSpinner() {
  return (
    <span
      className="inline-block size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
      aria-hidden
    />
  );
}

export default function Home({
  image,
  checkbox,
  setUpdatedAltText,
  componentKey,
  setCheckedImage,
  openSettingsModal,
}: {
  image: LegacyImage;
  checkbox: boolean;
  setUpdatedAltText: (p: { product_id: number; image_id: number; alt_text: string }, k: string | number) => void;
  componentKey: string | number;
  setCheckedImage: (c: boolean, p: CheckedPayload, k: string | number) => void;
  openSettingsModal?: () => void;
}) {
  const router = useRouter();

  const [altText, setAltText] = useState(image.description);
  const [checked, setChecked] = useState(checkbox);
  const [homeUrl] = useState(readChannelDomain);
  const [optimizeStatus, setOptimizeStatus] = useState(image.is_optimize);
  const [previewModal, setPreviewModal] = useState(false);
  const [size, setSize] = useState("");

  const getImageStatus = useCallback(() => {
    void ApiCall("imageOptimizer/getImagesStatus", {
      image_id: image.id,
      product_id: image.product_id,
      image_url: image.image_file,
    }).then((raw) => {
      const data = raw as ApiRes;
      if (data.status_code == 200) {
        setOptimizeStatus(data.data?.status);
        setSize(data.data?.image_size ?? "");
      } else {
        setOptimizeStatus(0);
        setSize("> 1MB");
      }
    });
  }, [image.id, image.product_id, image.image_file]);

  useEffect(() => {
    getImageStatus();
  }, [getImageStatus]);

  const imageOptimize = () => {
    setOptimizeStatus(5);
    void ApiCall("imageOptimizer/imageOptimize", {
      img_alt: altText,
      old_alt_text: image.description,
      img_name: image.image_file.split("/").pop(),
      real_image: image.image_file,
      product_id: image.product_id,
      image_id: image.id,
      is_thumbnail: image.is_thumbnail,
      sort_order: image.sort_order,
    }).then((raw) => {
      const data = raw as ApiRes;
      if (data.status_code == 202) {
        setOptimizeStatus(0);
        if (openSettingsModal) {
          openSettingsModal();
        } else {
          router.push("/image-optimizer-setting");
        }
      }
      if (data.status_code == 200) {
        setOptimizeStatus(2);
        toast.success(
          "Your image is queued for optimization. It may take up to a few hours depending on the queue our server has.",
        );
      }
      if (data.status_code == 204 || data.status_code == 203) {
        setOptimizeStatus(0);
        toast.error(data.message);
      }
    });
  };

  const RestoreOptimizeImage = () => {
    setOptimizeStatus(5);
    void ApiCall("imageOptimizer/RestoreOptimizeImage", {
      product_id: image.product_id,
      image_id: image.id,
    }).then((raw) => {
      const data = raw as ApiRes;
      if (data.status_code == 204 || data.status_code == 203) {
        setOptimizeStatus(1);
        toast.error(data.message);
      }
      if (data.status_code == 200) {
        setOptimizeStatus(3);
        toast.success(
          "Your image is queued for restore. It may take up to a few hours depending on the queue our server has.",
        );
      }
    });
  };

  useEffect(() => {
    setChecked(checkbox);
  }, [checkbox]);

  useEffect(() => {
    setCheckedImage(
      checked,
      {
        img_alt: altText,
        old_alt_text: image.description,
        img_name: image.image_file.split("/").pop(),
        real_image: image.image_file,
        product_id: image.product_id,
        image_id: image.id,
        is_thumbnail: image.is_thumbnail,
        sort_order: image.sort_order,
        is_optimize: image.is_optimize ?? 0,
      },
      componentKey,
    );
  }, [
    altText,
    checked,
    componentKey,
    image.description,
    image.id,
    image.image_file,
    image.is_optimize,
    image.is_thumbnail,
    image.product_id,
    image.sort_order,
    setCheckedImage,
  ]);

  return (
    <>
      <Previewmodal
        show={previewModal}
        onHide={() => setPreviewModal(false)}
        image={image}
        RestoreOptimizeImage={RestoreOptimizeImage}
        size={size}
      />
      <div className="optimizerList-box d-flex align-item-center gap-3">
        <div
          className={`optimizerProduct-img ${checked ? "check_active" : ""}`}
        >
          {image.image_file ? (
            <Image src={image.url_thumbnail} width={100} height={100} alt="" />
          ) : (
            <Image
              src={`${basePath}/images/noimage.jpg`}
              width={38}
              height={38}
              alt=""
            />
          )}
          {image.image_file && (
            <div className="optimizerProduct-imgHover">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={checked}
                  onChange={() => setChecked(!checked)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="optimizerProduct-imgfeild flex-grow-1 d-flex align-item-center gap-3">
          <div className="custom-input link-iconDropi flex-grow-1">
            <span>
              File Name
              <a href={`${homeUrl}/${image.url}`} target="_blank">
                <Image
                  src={`${basePath}/images/link-icon.svg`}
                  width={20}
                  height={20}
                  alt=""
                />
              </a>
            </span>
            <input
              type="text"
              placeholder="File name"
              className="form-control"
              value={image.image_file.split("/").pop()}
              disabled
            />
          </div>

          <div className="custom-input flex-grow-1">
            <span>Alt Text</span>
            <input
              disabled={image.image_file == ""}
              type="text"
              placeholder="Alt Text"
              className="form-control"
              value={altText}
              onChange={(e) => {
                setUpdatedAltText(
                  {
                    product_id: image.product_id,
                    image_id: image.id,
                    alt_text: e.target.value,
                  },
                  componentKey,
                );
                setAltText(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="optimizerProduct-actionInfo d-flex align-item-center gap-3">
          <span className="whitespace-nowrap">{size}</span>
          {optimizeStatus == 5 ? (
            <>
              <button
                type="button"
                className="imageOptimize-btn btn btn-default btn-disable"
              >
                <LoadingSpinner />
              </button>
              <button
                type="button"
                className="custom-btn black-iconBtn btn-disable"
                title="Restore"
              >
                <LoadingSpinner />
              </button>
            </>
          ) : optimizeStatus == 1 ? (
            <>
              <button
                type="button"
                className="imageOptimize-btn custom-btn"
                onClick={() => setPreviewModal(true)}
              >
                Preview
              </button>
              <button
                type="button"
                className="custom-btn black-iconBtn"
                title="Restore"
                onClick={RestoreOptimizeImage}
              >
                <Image
                  src={`${basePath}/images/restore-icon.svg`}
                  width={20}
                  height={20}
                  alt="Restore"
                />
              </button>
            </>
          ) : optimizeStatus == 2 ? (
            <>
              <button
                type="button"
                className="imageOptimize-btn btn btn-default btn-disable"
              >
                Optimizing
              </button>
              <button
                type="button"
                className="custom-btn black-iconBtn btn-disable"
                title="Restore"
              >
                <Image
                  src={`${basePath}/images/restore-icon.svg`}
                  width={20}
                  height={20}
                  alt="Restore"
                />
              </button>
            </>
          ) : optimizeStatus == 3 ? (
            <>
              <button
                type="button"
                className="imageOptimize-btn btn btn-default btn-disable"
              >
                Restoring
              </button>
              <button
                type="button"
                className="custom-btn black-iconBtn btn-disable"
                title="Restore"
              >
                <Image
                  src={`${basePath}/images/restore-icon.svg`}
                  width={20}
                  height={20}
                  alt="Restore"
                />
              </button>
            </>
          ) : (
            <>
              <button
                disabled={image.image_file == ""}
                type="button"
                className={`btn btn-default ${image.image_file == "" && "btn-disable"}`}
                onClick={imageOptimize}
              >
                Optimize
              </button>
              <button
                disabled={image.image_file == ""}
                type="button"
                className="custom-btn black-iconBtn btn-disable"
                title="Restore"
              >
                <Image
                  src={`${basePath}/images/restore-icon.svg`}
                  width={20}
                  height={20}
                  alt="Restore"
                />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
