"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { ApiCall } from "@/app/_api/apiCall";
import {
  CHANNEL_CHANGED_EVENT,
  readChannelId,
} from "@/app/_lib/channelStorage";
import { isApiError, isApiFailure } from "../../dashboard/_lib/apiUtils";
import TemplateBox from "./templateBox";
import CruiseControlSwitch from "./cruiseControlSwitch";
import {
  COMPRESSION_PRESET_ORDER,
  COMPRESSION_RANGES,
  FORMAT_OPTIONS,
  applyDefaults,
  clampQuality,
  getActivePreset,
  parseSettings,
  sliderFillPercent,
  type SettingsRow,
  zoneWidthPercent,
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
  const [autoOptimizeCategory, setAutoOptimizeCategory] = useState(false);
  const [webhookTogglePending, setWebhookTogglePending] = useState(false);
  const [categoryWebhookTogglePending, setCategoryWebhookTogglePending] =
    useState(false);
  const webhookAbortRef = useRef<AbortController | null>(null);
  const categoryWebhookAbortRef = useRef<AbortController | null>(null);
  const webhookRequestIdRef = useRef(0);
  const categoryWebhookRequestIdRef = useRef(0);

  const formatConversionEnabled = outputFormat !== "original";

  const formatRadioOptions = useMemo(() => {
    const known = FORMAT_OPTIONS.some((o) => o.id === outputFormat);
    if (known) return FORMAT_OPTIONS;
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
    setIsFilenameTemplateEnabled(row.is_filename_template_enabled);
    setFilenameTemplate(row.filename_template);
    setIsAltTextTemplateEnabled(row.is_alt_text_template_enabled);
    setAltTextTemplate(row.alt_text_template);
    setQuality(row.image_quality);
    setOutputFormat(row.output_format);
    setAutoOptimize(row.auto_optimize_new_images);
    setBaseline(row);
  }

  const hasUnsavedChanges = useMemo(() => {
    if (!baseline) return false;
    return (
      baseline.channel_id !== channelId ||
      baseline.is_filename_template_enabled !== isFilenameTemplateEnabled ||
      baseline.filename_template !== filenameTemplate ||
      baseline.is_alt_text_template_enabled !== isAltTextTemplateEnabled ||
      baseline.alt_text_template !== altTextTemplate ||
      baseline.image_quality !== quality ||
      baseline.output_format !== outputFormat ||
      baseline.auto_optimize_new_images !== autoOptimize
    );
  }, [
    baseline,
    channelId,
    isFilenameTemplateEnabled,
    filenameTemplate,
    isAltTextTemplateEnabled,
    altTextTemplate,
    quality,
    outputFormat,
    autoOptimize,
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

  useEffect(() => {
    const productAbortRef = webhookAbortRef;
    const categoryAbortRef = categoryWebhookAbortRef;

    return () => {
      productAbortRef.current?.abort();
      categoryAbortRef.current?.abort();
    };
  }, []);

  async function handleWebhookToggle({
    path,
    enabled: toggleEnabled,
    setEnabled,
    abortRef,
    requestIdRef,
    setPending,
    fallbackMessages,
    onSuccess,
  }: {
    path: string;
    enabled: boolean;
    setEnabled: (value: boolean) => void;
    abortRef: MutableRefObject<AbortController | null>;
    requestIdRef: MutableRefObject<number>;
    setPending: (value: boolean) => void;
    fallbackMessages: { on: string; off: string };
    onSuccess?: (next: boolean) => void;
  }) {
    const next = !toggleEnabled;
    const previous = toggleEnabled;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;

    setEnabled(next);
    setPending(true);

    try {
      const data = await ApiCall(
        path,
        {},
        {
          method: next ? "POST" : "DELETE",
          signal: controller.signal,
        },
      );

      if (requestId !== requestIdRef.current) return;
      if (data && typeof data === "object" && "aborted" in data) return;

      if (isApiError(data) || isApiFailure(data as { success?: boolean })) {
        setEnabled(previous);
        return;
      }

      const message =
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof (data as { message?: unknown }).message === "string"
          ? (data as { message: string }).message
          : next
            ? fallbackMessages.on
            : fallbackMessages.off;

      onSuccess?.(next);
      toast.success(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setPending(false);
      }
    }
  }

  function handleAutoOptimizeToggle() {
    void handleWebhookToggle({
      path: "settings/webhooks/product-created",
      enabled: autoOptimize,
      setEnabled: setAutoOptimize,
      abortRef: webhookAbortRef,
      requestIdRef: webhookRequestIdRef,
      setPending: setWebhookTogglePending,
      fallbackMessages: {
        on: "Auto-optimize enabled for new product images",
        off: "Auto-optimize disabled for new product images",
      },
      onSuccess: (next) => {
        setBaseline((current) =>
          current ? { ...current, auto_optimize_new_images: next } : current,
        );
      },
    });
  }

  function handleCategoryWebhookToggle() {
    void handleWebhookToggle({
      path: "settings/webhooks/category-created",
      enabled: autoOptimizeCategory,
      setEnabled: setAutoOptimizeCategory,
      abortRef: categoryWebhookAbortRef,
      requestIdRef: categoryWebhookRequestIdRef,
      setPending: setCategoryWebhookTogglePending,
      fallbackMessages: {
        on: "Auto-optimize enabled for new category images",
        off: "Auto-optimize disabled for new category images",
      },
    });
  }

  async function handleSave() {
    setSavePending(true);
    try {
      const payload: SettingsRow = {
        channel_id: readChannelId(),
        is_filename_template_enabled: isFilenameTemplateEnabled,
        filename_template: filenameTemplate,
        is_alt_text_template_enabled: isAltTextTemplateEnabled,
        alt_text_template: altTextTemplate,
        image_quality: quality,
        output_format: outputFormat,
        auto_optimize_new_images: autoOptimize,
      };
      const data = await ApiCall("settings", payload, {
        method: "PUT",
        rawBody: true,
      });
      if (isApiError(data) || isApiFailure(data as { success?: boolean })) {
        return;
      }
      const row = parseSettings(data);
      if (row) pushRow(row);
      else setBaseline(payload);
      toast.success("Settings saved");
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
    isFilenameTemplateEnabled,
    setIsFilenameTemplateEnabled,
    filenameTemplate,
    setFilenameTemplate,
    isAltTextTemplateEnabled,
    setIsAltTextTemplateEnabled,
    altTextTemplate,
    setAltTextTemplate,
    autoOptimize,
    webhookTogglePending,
    handleAutoOptimizeToggle,
    autoOptimizeCategory,
    categoryWebhookTogglePending,
    handleCategoryWebhookToggle,
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
    isFilenameTemplateEnabled,
    setIsFilenameTemplateEnabled,
    filenameTemplate,
    setFilenameTemplate,
    isAltTextTemplateEnabled,
    setIsAltTextTemplateEnabled,
    altTextTemplate,
    setAltTextTemplate,
    autoOptimize,
    webhookTogglePending,
    handleAutoOptimizeToggle,
    autoOptimizeCategory,
    categoryWebhookTogglePending,
    handleCategoryWebhookToggle,
  } = settings;

  return (
    <div className={className ?? "flex flex-col gap-4"}>
      <TemplateBox
        title="Image File Name Template"
        description="Use tokens to generate image file name"
        templateValue={filenameTemplate}
        onTemplateChange={setFilenameTemplate}
        joinWith="-"
        enabled={isFilenameTemplateEnabled}
        onEnabledChange={setIsFilenameTemplateEnabled}
      />

      <TemplateBox
        title="Alt Text Template"
        description="Use tokens to generate ALT text"
        templateValue={altTextTemplate}
        onTemplateChange={setAltTextTemplate}
        joinWith=" "
        enabled={isAltTextTemplateEnabled}
        onEnabledChange={setIsAltTextTemplateEnabled}
      />

      <div className="card !mb-0">
        <h2 className="mb-0 text-base font-bold text-[#303030]">
          Optimization Settings
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-2 md:items-start">
          <div className="order-2 space-y-4 md:order-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Image Quality
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {COMPRESSION_RANGES[activePreset].label} band ·{" "}
                  {COMPRESSION_RANGES[activePreset].min}–
                  {COMPRESSION_RANGES[activePreset].max}%
                </p>
              </div>
              <span className="text-2xl font-semibold tabular-nums text-blue-600">
                {quality}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {COMPRESSION_PRESET_ORDER.map((id) => {
                const range = COMPRESSION_RANGES[id];
                const isActive = activePreset === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setQuality(range.default)}
                    className={`rounded-lg border px-2 py-2.5 text-left transition-colors ${
                      isActive
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`block text-sm font-semibold ${
                        isActive ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {range.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {range.min}–{range.max}%
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative h-10 w-full">
              <div
                className="pointer-events-none absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 overflow-hidden rounded-full border border-gray-200/80"
                aria-hidden
              >
                <div
                  className="h-full bg-amber-200"
                  style={{ width: `${zoneWidthPercent(50, 65)}%` }}
                />
                <div
                  className="h-full bg-sky-200"
                  style={{ width: `${zoneWidthPercent(65, 80)}%` }}
                />
                <div
                  className="h-full bg-emerald-200"
                  style={{ width: `${zoneWidthPercent(80, 100)}%` }}
                />
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={quality}
                onChange={(e) =>
                  setQuality(clampQuality(Number(e.target.value)))
                }
                className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none bg-transparent [-moz-appearance:none] [-webkit-appearance:none] [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-track]:h-2 [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:shadow-md"
                aria-valuemin={50}
                aria-valuemax={100}
                aria-valuenow={quality}
                aria-label="Image quality percentage"
              />
            </div>

            <div className="relative h-4 text-xs font-medium text-gray-500">
              {[50, 65, 80, 100].map((tick) => (
                <span
                  key={tick}
                  className="absolute -translate-x-1/2 tabular-nums"
                  style={{ left: `${sliderFillPercent(tick)}%` }}
                >
                  {tick}%
                </span>
              ))}
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-900">
                  Image Format Conversion
                </h3>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formatConversionEnabled}
                  onClick={() =>
                    setFormatConversionEnabled(!formatConversionEnabled)
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${
                    formatConversionEnabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span className="sr-only">
                    {formatConversionEnabled
                      ? "Disable format conversion"
                      : "Enable format conversion"}
                  </span>
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      formatConversionEnabled
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Convert To</p>
                  <div className="space-y-2">
                    {formatRadioOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer gap-3 rounded-lg border bg-white p-3 transition-colors ${
                          outputFormat === opt.id
                            ? "border-blue-500 ring-1 ring-blue-500"
                            : "border-gray-200 hover:border-gray-300"
                        } ${!formatConversionEnabled && opt.id !== "original" ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <input
                          type="radio"
                          name="outputFormat"
                          value={opt.id}
                          checked={outputFormat === opt.id}
                          onChange={() => setOutputFormat(opt.id)}
                          disabled={
                            !formatConversionEnabled && opt.id !== "original"
                          }
                          className="mt-0.5 accent-blue-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {opt.label}
                            </span>
                            {opt.badge && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${opt.badge.className}`}
                              >
                                {opt.badge.text}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {opt.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {outputFormat === "webp" && formatConversionEnabled && (
                  <aside className="shrink-0 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-gray-700 lg:w-54">
                    <p className="font-semibold text-sky-900">Why WebP?</p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-snug">
                      <li>25–35% smaller size than JPEG/PNG</li>
                      <li>Faster page load time</li>
                      <li>Better for SEO</li>
                      <li>Supported by all modern browsers</li>
                    </ul>
                    <a
                      href="https://developers.google.com/speed/webp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                    >
                      Learn more
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  </aside>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card space-y-4 !mb-0">
        <h2 className="mb-0 text-base font-bold text-[#303030]">
          Cruise Control
        </h2>

        <CruiseControlSwitch
          label="Auto-Optimize New Product Images"
          enabled={autoOptimize}
          pending={webhookTogglePending}
          disabled={loadState === "loading"}
          onToggle={handleAutoOptimizeToggle}
          ariaLabels={{
            on: "Enable auto-optimize for new product images",
            off: "Disable auto-optimize for new product images",
            busy: "Updating product auto-optimize setting",
          }}
        />

        <CruiseControlSwitch
          label="Auto-Optimize New Category Images"
          enabled={autoOptimizeCategory}
          pending={categoryWebhookTogglePending}
          disabled={loadState === "loading"}
          onToggle={handleCategoryWebhookToggle}
          ariaLabels={{
            on: "Enable auto-optimize for new category images",
            off: "Disable auto-optimize for new category images",
            busy: "Updating category auto-optimize setting",
          }}
        />
      </div>

      {showActivityTable ? (
        <div className="card !mb-0 !p-0 overflow-hidden">
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
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        row[2] === "success"
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
};

export function SettingsSaveActions({
  settings,
  buttonClassName = "custom-btn",
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
        onClick={() => void handleSave()}
        disabled={savePending || loadState === "loading" || !hasUnsavedChanges}
        className={buttonClassName}
      >
        {savePending ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
