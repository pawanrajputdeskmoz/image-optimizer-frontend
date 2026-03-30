import { useState, useImperativeHandle, forwardRef } from "react";
import Home from "../../image-optimizer-setting/page";
import Image from "next/image";
import { basePath } from "@/app/lib/basePath";

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
      <button
        type="button"
        title="Setting"
        className="rounded-lg border border-zinc-200 bg-white p-2 shadow-sm hover:bg-zinc-50"
        onClick={handleShow}
      >
        <Image
          src={`${basePath}/images/setting-icon.svg`}
          width={20}
          height={21}
          alt="setting-icon"
        />
      </button>

      {show ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close settings drawer"
            onClick={handleClose}
          />

          <div className="absolute right-0 top-0 h-full w-full overflow-y-auto bg-white shadow-xl sm:max-w-[520px] md:max-w-[780px] lg:max-w-[980px]">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase text-zinc-500">
                  Image Optimizer
                </p>
                <h4 className="mt-1 text-base font-semibold text-zinc-900">
                  Image Optimizer Settings
                </h4>
                <p className="mt-2 text-xs text-zinc-600">
                  Control how your images, alt text and optimization settings are handled.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label="Close"
                onClick={handleClose}
              >
                ✕
              </button>
            </div>
            <Home onClose={handleClose} />
          </div>
        </div>
      ) : null}
    </>
  );
});

ImageModal.displayName = "ImageModal";

export default ImageModal;
