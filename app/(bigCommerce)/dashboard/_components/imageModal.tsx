import { useState, useImperativeHandle, forwardRef } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Home from "../../image-optimizer-setting/page";
import Image from "next/image";
import { basePath } from "@/next.config";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export interface ImageModalRef {
  openModal: () => void;
  closeModal: () => void;
}

interface ImageModalProps {
  onClose?: () => void;
}

const ImageModal = forwardRef<ImageModalRef, ImageModalProps>((props, ref) => {
  const [show, setShow] = useState(false);

  const handleClose = () => {
    setShow(false);
    if (props.onClose) {
      props.onClose();
    }
  };
  const handleShow = () => setShow(true);

  useImperativeHandle(ref, () => ({
    openModal: handleShow,
    closeModal: handleClose,
  }));

  return (
    <>
      <OverlayTrigger placement="top" overlay={<Tooltip>Setting</Tooltip>}>
        <button
          type="button"
          className="custom-btn black-iconBtn"
          onClick={handleShow}
        >
          <Image
            src={`${basePath}/images/setting-icon.svg`}
            width={20}
            height={21}
            alt="setting-icon"
          />
        </button>
      </OverlayTrigger>

      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="end"
        style={{ width: "980px" }}
      >
        <Offcanvas.Header
          closeButton
          style={{ backgroundColor: "#F3F3F3", padding: "12px 16px" }}
        >
          <Offcanvas.Title>
            <div className="">
              <p className="text-xs text-[#616161] font-normal uppercase">
                Image Optimizer
              </p>
              <h4 className="text-base font-semibold mb-[2px]">
                Image Optimizer Settings
              </h4>
              <p className="text-xs text-[#616161] font-normal">
                Control how SEOKart renames images, generates alt text and
                compresses images for your store.
              </p>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Home onClose={handleClose} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
});

ImageModal.displayName = "ImageModal";

export default ImageModal;
