"use client";

import { AlertTriangle, CheckCheck, FileImage, FileText, RotateCcw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RestoreConfirmModalProps = {
  open: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const RESTORE_DETAILS = [
  {
    icon: FileImage,
    title: "Original File Sizes",
    description: "Complete lossless recovery",
  },
  {
    icon: FileImage,
    title: "Source Formats",
    description: ".png, .jpg, .WebP",
  },
  {
    icon: FileText,
    title: "Alt Text Restoration",
    description: "Recover original accessibility descriptions",
  },
];

export default function RestoreConfirmModal({
  open,
  isPending = false,
  onConfirm,
  onCancel,
}: RestoreConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden p-0 sm:max-w-125"
      >
        {/* Coloured top stripe */}
        <div className="h-1 w-full bg-[#303030]" />

        {/* Header */}
        <DialogHeader className="border-b border-[rgba(0,0,0,0.08)] px-6 pt-5 pb-4">
          <div className="flex items-center gap-4 pr-8">
            <div className="relative shrink-0">
              <span className="inline-flex size-12 items-center justify-center rounded-[14px] bg-[#F1F1F1]">
                <RotateCcw className="size-5 text-[#303030]" strokeWidth={1.8} />
              </span>
              <span className="absolute -right-1 -bottom-1 inline-flex size-5 items-center justify-center rounded-full bg-[#E3FBE7] ring-2 ring-white">
                <CheckCheck className="size-3 text-[#0B7A2B]" strokeWidth={2.5} />
              </span>
            </div>

            <div className="min-w-0 text-left">
              <DialogTitle className="text-base font-bold text-[#303030]">
                Restore Original Images
              </DialogTitle>
              <DialogDescription className="text-xs font-normal text-[#616161]">
                Revert your selected media to their pristine, uncompressed source
                state.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Restoration details */}
        <div className="border-b border-[rgba(0,0,0,0.08)] px-6 py-5">
          <p className="mb-3 text-[10px] font-bold tracking-widest text-[#9A9A9A] uppercase">
            Restoration Details
          </p>
          <div className="space-y-2">
            {RESTORE_DETAILS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-xl border border-[rgba(0,0,0,0.07)] bg-[#FAFAFA] px-4 py-3"
                >
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] ring-1 ring-[rgba(0,0,0,0.06)]">
                    <Icon className="size-4 text-[#303030]" />
                  </span>
                  <div className="min-w-0">
                    <p className="mb-0 text-[13px] font-semibold text-[#303030]">
                      {item.title}
                    </p>
                    <p className="mb-0 text-[11px] font-normal text-[#616161]">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning */}
        <div className="px-6 py-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-[rgba(224,49,49,0.18)] bg-[#FFF5F5] px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#E03131]" />
            <p className="mb-0 text-[11px] font-normal leading-relaxed text-[#303030]">
              <span className="font-semibold text-[#E03131]">Important notice: </span>
              This process will replace all existing optimized versions. This
              action is final and cannot be reversed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="mx-0 mb-0 border-t border-[rgba(0,0,0,0.08)] bg-[#F9F9F9] px-6 py-4 sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-default min-w-24"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="custom-btn min-w-36 gap-2"
          >
            {isPending ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Restoring…
              </>
            ) : (
              <>
                <RotateCcw className="size-3.5" />
                Confirm Restore
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
