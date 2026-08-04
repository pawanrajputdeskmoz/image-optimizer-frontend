"use client";

import { AlertTriangle, CheckCheck, FileImage, Sparkles, Zap } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OptimizeConfirmModalProps = {
  open: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const OPTIMIZE_DETAILS = [
  {
    icon: Zap,
    title: "Image Compression",
    description: "Reduce file size while preserving visual quality",
  },
  {
    icon: FileImage,
    title: "Format Conversion",
    description: "Apply your selected output format and quality settings",
  },
  {
    icon: Sparkles,
    title: "Alt Text Generation",
    description: "Update alt text when enabled in your settings",
  },
];

export default function OptimizeConfirmModal({
  open,
  isPending = false,
  onConfirm,
  onCancel,
}: OptimizeConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden p-0 sm:max-w-125"
      >
        <div className="h-1 w-full bg-[#303030]" />

        <DialogHeader className="border-b border-[rgba(0,0,0,0.08)] px-6 pt-5 pb-4">
          <div className="flex items-center gap-4 pr-8">
            <div className="relative shrink-0">
              <span className="inline-flex size-12 items-center justify-center rounded-[14px] bg-[#F1F1F1]">
                <Zap className="size-5 text-[#303030]" strokeWidth={1.8} />
              </span>
              <span className="absolute -right-1 -bottom-1 inline-flex size-5 items-center justify-center rounded-full bg-[#E3FBE7] ring-2 ring-white">
                <CheckCheck className="size-3 text-[#0B7A2B]" strokeWidth={2.5} />
              </span>
            </div>

            <div className="min-w-0 text-left">
              <DialogTitle className="text-base font-bold text-[#303030]">
                Optimize All Images
              </DialogTitle>
              <DialogDescription className="text-xs font-normal text-[#616161]">
                Run optimization across all pending images using your current
                settings.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-b border-[rgba(0,0,0,0.08)] px-6 py-5">
          <p className="mb-3 text-[10px] font-bold tracking-widest text-[#9A9A9A] uppercase">
            Optimization Details
          </p>
          <div className="space-y-2">
            {OPTIMIZE_DETAILS.map((item) => {
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

        <div className="px-6 py-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-[rgba(217,119,6,0.22)] bg-[#FFF7ED] px-4 py-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#D97706]" />
            <p className="mb-0 text-[11px] font-normal leading-relaxed text-[#303030]">
              <span className="font-semibold text-[#D97706]">Important notice: </span>
              This will queue optimization for all eligible images. Already
              optimized images will be skipped.
            </p>
          </div>
        </div>

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
                Optimizing…
              </>
            ) : (
              <>
                <Zap className="size-3.5" />
                Confirm Optimize
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
