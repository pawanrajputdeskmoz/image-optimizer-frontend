"use client";

import { useState } from "react";
import { Settings } from "lucide-react";

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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export default function OptimizationSettingsDialog({
  triggerClassName = "btn-default",
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: OptimizationSettingsDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  const settings = useOptimizationSettings({ enabled: open });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger ? (
        <DialogTrigger className={triggerClassName}>
          <Settings className="size-3.5 shrink-0" aria-hidden />
          Optimization Setting
        </DialogTrigger>
      ) : null}
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
