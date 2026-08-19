"use client";

import ImageOptimizerAppHeader from "@/app/_components/imageOptimizerAppHeader";
import {
  OptimizationSettingsForm,
  SettingsSaveActions,
  useOptimizationSettings,
} from "./_components/optimizationSettingsForm";

export default function SettingsUI() {
  const settings = useOptimizationSettings({ enabled: true });

  return (
    <div className="flex flex-col gap-4 pb-6">
      <ImageOptimizerAppHeader
        title="Settings"
        subtitle="Configure filename, alt text, and compression preferences."
        actions={<SettingsSaveActions settings={settings} />}
      />

      <OptimizationSettingsForm settings={settings} />
    </div>
  );
}
