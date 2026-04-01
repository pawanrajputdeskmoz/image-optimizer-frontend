"use client";

import { useEffect, useState } from "react";
import ReactCompareImage from "react-compare-image";

type Props = {
  beforeSrc: string; // old image
  afterSrc: string;  // new image
  open?: boolean;
  onClose?: () => void;
};

export default function ImageComparePopup({
  beforeSrc,
  afterSrc,
  open = false,
  onClose,
}: Props) {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  if (!isOpen) return null;

  const close = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-4 relative">
        {/* Close */}
        <button
          onClick={close}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-4">
          Before vs After Comparison
        </h2>

        <div className="overflow-hidden rounded-lg">
          <ReactCompareImage
            leftImage={beforeSrc}
            rightImage={afterSrc}
            leftImageLabel="Old"
            rightImageLabel="New"
            sliderLineColor="#ffffff"
            sliderLineWidth={2}
            handleSize={42}
            aspectRatio="wider"
            skeleton={<div className="h-64 md:h-96 w-full bg-gray-200 animate-pulse" />}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Old</span>
          <span>New</span>
        </div>
      </div>
    </div>
  );
}

/*
USAGE:

<ImageComparePopup
  beforeSrc="/images/old.jpg"
  afterSrc="/images/new.jpg"
/>
*/