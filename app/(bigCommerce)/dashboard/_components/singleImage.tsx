import { basePath } from "@/next.config";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { Api } from "@/app/_api/apiCall";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Previewmodal from "./previewModal";
import UpgradePopup from "@/app/_lib/upgradePopup";
import { GlobalContext } from "@/app/_context/global";

export default function Home({
  image,
  checkbox,
  setUpdatedAltText,
  componentKey,
  setCheckedImage,
  openSettingsModal,
}: {
  image: any;
  checkbox: any;
  setUpdatedAltText: any;
  componentKey: any;
  setCheckedImage: any;
  openSettingsModal?: () => void;
}) {
  const router = useRouter();

  const [altText, setAltText] = useState(image.description);
  const [checked, setChecked] = useState(checkbox);
  const [homeUrl, setHomeUrl] = useState("");
  const [optimizeStatus, setOptimizeStatus] = useState(image.is_optimize);
  const [previewModal, setPreviewModal] = useState(false);
  const [size, setSize] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const { userStatus } = useContext(GlobalContext);

  const getImageStatus = () => {
    Api("imageOptimizer/getImagesStatus", {
      image_id: image.id,
      product_id: image.product_id,
      image_url: image.image_file,
    }).then((data) => {
      if (data.status_code == 200) {
        setOptimizeStatus(data.data.status);
        setSize(data.data.image_size);
      } else {
        setOptimizeStatus(0);
        setSize("> 1MB");
      }
    });
  };

  useEffect(() => {
    getImageStatus();
  }, []);

  const imageOptimize = () => {
    setOptimizeStatus(5);
    Api("imageOptimizer/imageOptimize", {
      img_alt: altText,
      old_alt_text: image.description,
      img_name: image.image_file.split("/").pop(),
      real_image: image.image_file,
      product_id: image.product_id,
      image_id: image.id,
      is_thumbnail: image.is_thumbnail,
      sort_order: image.sort_order,
    }).then((data) => {
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
    Api("imageOptimizer/RestoreOptimizeImage", {
      product_id: image.product_id,
      image_id: image.id,
    }).then((data) => {
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
  }, [checked]);

  useEffect(() => {
    const channelObj = JSON.parse(localStorage?.getItem("channel") ?? "");
    setHomeUrl(channelObj.domain);
  }, []);

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
                <Spinner size="sm" />
              </button>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Restore</Tooltip>}
              >
                <button
                  type="button"
                  className="custom-btn black-iconBtn btn-disable"
                >
                  <Spinner size="sm" />
                </button>
              </OverlayTrigger>
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
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Restore</Tooltip>}
              >
                <button
                  type="button"
                  className="custom-btn black-iconBtn"
                  onClick={RestoreOptimizeImage}
                >
                  <Image
                    src={`${basePath}/images/restore-icon.svg`}
                    width={20}
                    height={20}
                    alt=""
                  />
                </button>
              </OverlayTrigger>
            </>
          ) : optimizeStatus == 2 ? (
            <>
              <button
                type="button"
                className="imageOptimize-btn btn btn-default btn-disable"
              >
                Optimizing
              </button>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Restore</Tooltip>}
              >
                <button
                  type="button"
                  className="custom-btn black-iconBtn btn-disable"
                >
                  <Image
                    src={`${basePath}/images/restore-icon.svg`}
                    width={20}
                    height={20}
                    alt=""
                  />
                </button>
              </OverlayTrigger>
            </>
          ) : optimizeStatus == 3 ? (
            <>
              <button
                type="button"
                className="imageOptimize-btn btn btn-default btn-disable"
              >
                Restoring
              </button>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Restore</Tooltip>}
              >
                <button
                  type="button"
                  className="custom-btn black-iconBtn btn-disable"
                >
                  <Image
                    src={`${basePath}/images/restore-icon.svg`}
                    width={20}
                    height={20}
                    alt=""
                  />
                </button>
              </OverlayTrigger>
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
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Restore</Tooltip>}
              >
                <button
                  disabled={image.image_file == ""}
                  type="button"
                  className="custom-btn black-iconBtn btn-disable"
                >
                  <Image
                    src={`${basePath}/images/restore-icon.svg`}
                    width={20}
                    height={20}
                    alt=""
                  />
                </button>
              </OverlayTrigger>
            </>
          )}
        </div>
      </div>
    </>
  );
}
