"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";

import { ApiCall } from "@/app/_api/apiCall";
import {
  CHANNEL_CHANGED_EVENT,
  readChannelId,
} from "@/app/_lib/channelStorage";
import { isApiError, isApiFailure } from "../../dashboard/_lib/apiUtils";
import TemplateBox from "./templateBox";
import OptimizationModeCard, {
  type OptimizationModeId,
} from "./optimizationModeCard";
import VcToggleSwitch from "./vcToggleSwitch";
import {
  COMPRESSION_PRESET_ORDER,
  COMPRESSION_RANGES,
  FORMAT_OPTIONS,
  QUALITY_MAX,
  QUALITY_MIN,
  applyDefaults,
  clampQuality,
  getActivePreset,
  getPresetBadgeLabel,
  parseSettings,
  sliderFillPercent,
  type SettingsRow,
} from "../_lib/optimizationSettingsUtils";

type UseOptimizationSettingsOptions = {
  enabled?: boolean;
};

export function useOptimizationSettings({
  enabled = true,
}: UseOptimizationSettingsOptions = {}) {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    enabled ? "loading" : "ready",
  );
  const [savePending, setSavePending] = useState(false);
  const [baseline, setBaseline] = useState<SettingsRow | null>(null);

  const [channelId, setChannelId] = useState<number>(() => readChannelId());
  const [optimizeImageEnabled, setOptimizeImageEnabled] = useState(true);
  const [isFilenameTemplateEnabled, setIsFilenameTemplateEnabled] =
    useState(true);
  const [filenameTemplate, setFilenameTemplate] = useState("[name]");
  const [isAltTextTemplateEnabled, setIsAltTextTemplateEnabled] =
    useState(true);
  const [altTextTemplate, setAltTextTemplate] = useState("[name]");
  const [quality, setQuality] = useState<number>(
    COMPRESSION_RANGES.high.default,
  );
  const activePreset = getActivePreset(quality);
  const [outputFormat, setOutputFormat] = useState<string>("webp");
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [autoOptimizeCategory, setAutoOptimizeCategory] = useState(true);

  const cruiseControlEnabled = autoOptimize && autoOptimizeCategory;
  const formatConversionEnabled = outputFormat !== "original";

  const formatRadioOptions = useMemo(() => {
    const known = FORMAT_OPTIONS.some((o) => o.id === outputFormat);
    if (known) return FORMAT_OPTIONS;
    // Keep unknown server formats visible (e.g. legacy avif)
    return [
      ...FORMAT_OPTIONS,
      {
        id: outputFormat,
        label: `${outputFormat} (from server)`,
        description: "This format is saved on your account",
      },
    ];
  }, [outputFormat]);

  function pushRow(row: SettingsRow) {
    setChannelId(row.channel_id);
    setOptimizeImageEnabled(row.optimize_image_enabled);
    setIsFilenameTemplateEnabled(row.is_filename_template_enabled);
    setFilenameTemplate(row.filename_template);
    setIsAltTextTemplateEnabled(row.is_alt_text_template_enabled);
    setAltTextTemplate(row.alt_text_template);
    setQuality(row.image_quality);
    setOutputFormat(row.output_format);
    setAutoOptimize(row.auto_optimize_new_images);
    setAutoOptimizeCategory(row.auto_optimize_new_category_images);
    setBaseline(row);
  }

  const hasUnsavedChanges = useMemo(() => {
    if (!baseline) return false;
    return (
      baseline.channel_id !== channelId ||
      baseline.optimize_image_enabled !== optimizeImageEnabled ||
      baseline.is_filename_template_enabled !== isFilenameTemplateEnabled ||
      baseline.filename_template !== filenameTemplate ||
      baseline.is_alt_text_template_enabled !== isAltTextTemplateEnabled ||
      baseline.alt_text_template !== altTextTemplate ||
      baseline.image_quality !== quality ||
      baseline.output_format !== outputFormat ||
      baseline.auto_optimize_new_images !== autoOptimize ||
      baseline.auto_optimize_new_category_images !== autoOptimizeCategory
    );
  }, [
    baseline,
    channelId,
    optimizeImageEnabled,
    isFilenameTemplateEnabled,
    filenameTemplate,
    isAltTextTemplateEnabled,
    altTextTemplate,
    quality,
    outputFormat,
    autoOptimize,
    autoOptimizeCategory,
  ]);

  async function load() {
    setLoadState("loading");
    const cid = readChannelId();
    setChannelId(cid);

    const data = await ApiCall("settings", {}, { method: "GET" });
    if (isApiError(data)) {
      setLoadState("error");
      pushRow(applyDefaults(cid));
      return;
    }
    const row = parseSettings(data);
    if (!row) {
      setLoadState("error");
      pushRow(applyDefaults(cid));
      return;
    }
    pushRow(row);
    setLoadState("ready");
  }

  useEffect(() => {
    if (!enabled) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onChannelChanged = () => {
      void load();
    };

    window.addEventListener(CHANNEL_CHANGED_EVENT, onChannelChanged);
    return () => {
      window.removeEventListener(CHANNEL_CHANGED_EVENT, onChannelChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  async function handleCruiseControlToggle() {
    const next = !cruiseControlEnabled;
    setAutoOptimize(next);
    setAutoOptimizeCategory(next);
  }

  async function syncCruiseControlWebhooks(enabled: boolean) {
    const method = enabled ? "POST" : "DELETE";
    const [productRes, categoryRes] = await Promise.all([
      ApiCall("settings/webhooks/product-created", {}, { method }),
      ApiCall("settings/webhooks/category-created", {}, { method }),
    ]);

    const productFailed =
      isApiError(productRes) ||
      isApiFailure(productRes as { success?: boolean });
    const categoryFailed =
      isApiError(categoryRes) ||
      isApiFailure(categoryRes as { success?: boolean });

    if (productFailed || categoryFailed) {
      return false;
    }

    return true;
  }

  async function handleSave(): Promise<boolean> {
    setSavePending(true);
    try {
      const payload: SettingsRow = {
        channel_id: readChannelId(),
        optimization_mode: optimizeImageEnabled
          ? isAltTextTemplateEnabled
            ? "optimize_and_alt"
            : "optimize_only"
          : "alt_only",
        optimize_image_enabled: optimizeImageEnabled,
        is_filename_template_enabled: isFilenameTemplateEnabled,
        filename_template: filenameTemplate,
        is_alt_text_template_enabled: isAltTextTemplateEnabled,
        alt_text_template: altTextTemplate,
        image_quality: quality,
        output_format: outputFormat,
        auto_optimize_new_images: autoOptimize,
        auto_optimize_new_category_images: autoOptimizeCategory,
      };
      const data = await ApiCall("settings", payload, {
        method: "PUT",
        rawBody: true,
      });
      if (isApiError(data) || isApiFailure(data as { success?: boolean })) {
        if (isApiFailure(data as { success?: boolean; message?: string })) {
          toast.error(
            (data as { message?: string }).message || "Failed to save settings",
          );
        }
        return false;
      }

      const cruiseChanged =
        !baseline ||
        baseline.auto_optimize_new_images !== autoOptimize ||
        baseline.auto_optimize_new_category_images !== autoOptimizeCategory;

      if (cruiseChanged) {
        const webhookOk = await syncCruiseControlWebhooks(cruiseControlEnabled);
        if (!webhookOk) {
          toast.error("Could not update Cruise Control webhooks");
          return false;
        }
      }

      const row = parseSettings(data);
      if (row) {
        pushRow({
          ...row,
          auto_optimize_new_images: autoOptimize,
          auto_optimize_new_category_images: autoOptimizeCategory,
        });
      } else {
        setBaseline(payload);
      }
      toast.success("Settings saved");
      return true;
    } finally {
      setSavePending(false);
    }
  }

  const setFormatConversionEnabled = (nextEnabled: boolean) => {
    if (nextEnabled) {
      if (outputFormat === "original") {
        setOutputFormat("webp");
      }
    } else {
      setOutputFormat("original");
    }
  };

  return {
    loadState,
    savePending,
    hasUnsavedChanges,
    handleSave,
    load,
    activePreset,
    quality,
    setQuality,
    formatConversionEnabled,
    setFormatConversionEnabled,
    formatRadioOptions,
    outputFormat,
    setOutputFormat,
    optimizeImageEnabled,
    setOptimizeImageEnabled,
    isFilenameTemplateEnabled,
    setIsFilenameTemplateEnabled,
    filenameTemplate,
    setFilenameTemplate,
    isAltTextTemplateEnabled,
    setIsAltTextTemplateEnabled,
    altTextTemplate,
    setAltTextTemplate,
    cruiseControlEnabled,
    handleCruiseControlToggle,
  };
}

export type OptimizationSettingsState = ReturnType<
  typeof useOptimizationSettings
>;

type OptimizationSettingsFormProps = {
  settings: OptimizationSettingsState;
  showActivityTable?: boolean;
  className?: string;
};

export function OptimizationSettingsForm({
  settings,
  showActivityTable = false,
  className,
}: OptimizationSettingsFormProps) {
  const {
    loadState,
    activePreset,
    quality,
    setQuality,
    formatConversionEnabled,
    setFormatConversionEnabled,
    formatRadioOptions,
    outputFormat,
    setOutputFormat,
    optimizeImageEnabled,
    setOptimizeImageEnabled,
    isFilenameTemplateEnabled,
    setIsFilenameTemplateEnabled,
    filenameTemplate,
    setFilenameTemplate,
    isAltTextTemplateEnabled,
    setIsAltTextTemplateEnabled,
    altTextTemplate,
    setAltTextTemplate,
    cruiseControlEnabled,
    handleCruiseControlToggle,
  } = settings;

  const fillPercent = sliderFillPercent(quality);
  const selectedMode: OptimizationModeId = optimizeImageEnabled
    ? isAltTextTemplateEnabled
      ? "optimize_and_alt"
      : "optimize_only"
    : "alt_only";

  const showOptimizationSettings = optimizeImageEnabled;
  const showFilenameTemplate = optimizeImageEnabled;
  const showAltTemplate = !optimizeImageEnabled || isAltTextTemplateEnabled;

  const handleModeSelect = (mode: OptimizationModeId) => {
    if (mode === "alt_only") {
      setOptimizeImageEnabled(false);
      setIsAltTextTemplateEnabled(true);
      return;
    }

    setOptimizeImageEnabled(true);
    if (mode === "optimize_only") {
      setIsAltTextTemplateEnabled(false);
      return;
    }

    setIsAltTextTemplateEnabled(true);
  };

  return (
    <div className={className ?? "flex flex-col gap-4"}>
      {/* Cruise Control */}
      <div className="flex items-center gap-3 rounded-xl border border-[#D1D1D1] bg-[#F8F8F8] p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#303030]">
          <Zap className="size-5 fill-white text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h6 className="text-sm font-semibold text-[#303030]">Cruise Control</h6>
          <p className="text-xs text-[#616161] font-normal mb-0">
            Auto-optimize new product and category images as they arrive
          </p>
        </div>
        <VcToggleSwitch
          enabled={cruiseControlEnabled}
          disabled={loadState === "loading"}
          onToggle={() => void handleCruiseControlToggle()}
          label={
            cruiseControlEnabled
              ? "Disable Cruise Control"
              : "Enable Cruise Control"
          }
        />
      </div>

      <OptimizationModeCard
        selectedMode={selectedMode}
        onSelectMode={handleModeSelect}
      />

      {showOptimizationSettings ? (
        <div className="card mb-0! shadow-none!">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
              Optimization Parameters
            </h2>
          </div>

          <div className="space-y-6">
            {/* Image Compression */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Image Compression
                </h3>
                <span className="rounded-full bg-[#5D5FEF]/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#5D5FEF] uppercase">
                  {getPresetBadgeLabel(quality)}
                </span>
              </div>

              <div className="relative pt-1">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#E5E5E5]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#303030]"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={QUALITY_MIN}
                  max={QUALITY_MAX}
                  value={quality}
                  onChange={(e) =>
                    setQuality(clampQuality(Number(e.target.value)))
                  }
                  className="absolute inset-x-0 top-0 z-10 m-0 h-4 w-full cursor-pointer appearance-none bg-transparent [-moz-appearance:none] [-webkit-appearance:none] [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#303030] [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-track]:h-2 [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#303030] [&::-moz-range-thumb]:shadow-md"
                  aria-valuemin={QUALITY_MIN}
                  aria-valuemax={QUALITY_MAX}
                  aria-valuenow={quality}
                  aria-label="Image compression quality"
                />
              </div>

              <div className="grid grid-cols-3 text-[11px] font-semibold tracking-wide uppercase">
                {COMPRESSION_PRESET_ORDER.map((id) => {
                  const range = COMPRESSION_RANGES[id];
                  const isActive = activePreset === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setQuality(range.default)}
                      className={`${id === "medium"
                          ? "text-center"
                          : id === "high"
                            ? "text-right"
                            : "text-left"
                        } ${isActive
                          ? "rounded-md bg-[#F1F1F1] px-1.5 py-1 text-[#303030]"
                          : "px-1.5 py-1 text-gray-400 hover:text-gray-600"
                        }`}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image Format Conversion */}
            <div className="space-y-3 border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Image Format Conversion
                </h3>
                <VcToggleSwitch
                  enabled={formatConversionEnabled}
                  onToggle={() =>
                    setFormatConversionEnabled(!formatConversionEnabled)
                  }
                  label={
                    formatConversionEnabled
                      ? "Disable format conversion"
                      : "Enable format conversion"
                  }
                />
              </div>

              <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                Convert To
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {formatRadioOptions.map((opt) => {
                  const selected = outputFormat === opt.id;
                  const disabled =
                    !formatConversionEnabled && opt.id !== "original";

                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer gap-3 rounded-xl border bg-white p-3.5 transition-colors ${selected
                          ? "border-[#5D5FEF] bg-[#FDFDFD]"
                          : "border-gray-200 hover:border-gray-300"
                        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <input
                        type="radio"
                        name="outputFormat"
                        value={opt.id}
                        checked={selected}
                        onChange={() => setOutputFormat(opt.id)}
                        disabled={disabled}
                        className="mt-1 accent-[#303030]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {opt.label}
                          </span>
                          {opt.badge ? (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${opt.badge.className}`}
                            >
                              {opt.badge.text}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {opt.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showFilenameTemplate ? (
        <TemplateBox
          title="File Name Template"
          description="Build image filenames with text and product variables."
          templateValue={filenameTemplate}
          onTemplateChange={setFilenameTemplate}
          enabled={isFilenameTemplateEnabled}
          onEnabledChange={setIsFilenameTemplateEnabled}
          defaultTemplate="[name]"
          previewMode="filename"
          outputFormat={outputFormat}
        />
      ) : null}

      {showAltTemplate ? (
        <TemplateBox
          title="Alt Text Template"
          description="Build alt text with text and product variables."
          templateValue={altTextTemplate}
          onTemplateChange={setAltTextTemplate}
          enabled={isAltTextTemplateEnabled}
          onEnabledChange={setIsAltTextTemplateEnabled}
          toggleDisabled={selectedMode === "alt_only"}
          defaultTemplate="[name]"
          previewMode="alt"
        />
      ) : null}

      {showActivityTable ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-0! shadow-sm">
          <table className="w-full text-xs md:text-[13px]">
            <thead>
              <tr className="border-b border-[#ebebeb] text-left text-[#616161]">
                <th className="px-4 py-2 font-medium">Product Name</th>
                <th className="font-medium">Images Optimized</th>
                <th className="font-medium">Status</th>
                <th className="font-medium">Compression</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Sports Jacket", "12", "success", "Today, 3:15 PM"],
                ["Handbag Set", "8", "success", "Yesterday, 5:40 PM"],
                ["Camera Lens", "15", "failed", "Apr 18, 2:20 PM"],
              ].map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[#ebebeb] last:border-none"
                >
                  <td className="px-4 py-2 text-[#303030]">{row[0]}</td>
                  <td className="text-[#303030]">{row[1]}</td>
                  <td>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${row[2] === "success"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                        }`}
                    >
                      {row[2]}
                    </span>
                  </td>
                  <td className="text-[#303030]">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

type SettingsSaveActionsProps = {
  settings: OptimizationSettingsState;
  buttonClassName?: string;
  onSaveSuccess?: () => void;
};

export function SettingsSaveActions({
  settings,
  buttonClassName = "custom-btn",
  onSaveSuccess,
}: SettingsSaveActionsProps) {
  const { loadState, savePending, hasUnsavedChanges, handleSave, load } =
    settings;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {loadState === "loading" && (
        <span className="text-[12px] text-[#616161]">Loading…</span>
      )}
      {loadState === "error" && (
        <span className="text-[12px] text-amber-700">
          Could not load settings (using defaults).{" "}
          <button
            type="button"
            className="font-medium text-[#4b71fc] underline"
            onClick={() => void load()}
          >
            Retry
          </button>
        </span>
      )}
      <button
        type="button"
        onClick={() => {
          void handleSave().then((ok) => {
            if (ok) onSaveSuccess?.();
          });
        }}
        disabled={savePending || loadState === "loading" || !hasUnsavedChanges}
        className={buttonClassName}
      >
        {savePending ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
