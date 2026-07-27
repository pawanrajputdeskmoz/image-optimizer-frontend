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
      <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-[#ebebeb] px-6 py-4">
          <DialogTitle className="text-base font-bold text-[#303030]">
            Optimization Settings
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#616161]">
            Configure filename, alt text, and compression preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <OptimizationSettingsForm settings={settings} />
        </div>

        <DialogFooter className="mx-0 mb-0 border-t border-[#ebebeb] bg-[#fafafa] px-6 py-4 sm:justify-end">
          <SettingsSaveActions
            settings={settings}
            buttonClassName="custom-btn min-w-32"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
