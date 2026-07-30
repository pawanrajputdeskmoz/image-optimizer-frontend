"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  OptimizationSettingsForm,
  SettingsSaveActions,
  useOptimizationSettings,
} from "../../setting/_components/optimizationSettingsForm";

type OptimizationSettingsDialogProps = {
  triggerClassName?: string;
};

export default function OptimizationSettingsDialog({
  triggerClassName = "btn-default",
}: OptimizationSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const settings = useOptimizationSettings({ enabled: open });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={triggerClassName}>
        Optimization Setting
      </DialogTrigger>
      <DialogContent className="flex max-h-[96vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-gray-100 px-5 py-4 gap-0">
          <DialogTitle className="text-base font-bold text-gray-900">
            Image Optimizer Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-[#616161] font-normal mb-0">
            Configure filename, alt text, and compression preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <OptimizationSettingsForm settings={settings} />
        </div>

        <DialogFooter className="mx-0 mb-0 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:justify-end">
          <SettingsSaveActions
            settings={settings}
            buttonClassName="custom-btn min-w-32"
            onSaveSuccess={() => setOpen(false)}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
