"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import TemplateBox from "./_components/templateBox";
import { ApiCall } from "@/app/_api/apiCall";

const QUALITY_MIN = 50;
const QUALITY_MAX = 100;

const COMPRESSION_RANGES = {
  low: { min: 50, max: 65, default: 57, label: "Low" },
  medium: { min: 65, max: 80, default: 72, label: "Medium" },
  high: { min: 80, max: 100, default: 90, label: "High" },
} as const;

type CompressionPresetId = keyof typeof COMPRESSION_RANGES;

const COMPRESSION_PRESET_ORDER: CompressionPresetId[] = [
  "low",
  "medium",
  "high",
];

function clampQuality(value: number) {
  return Math.min(QUALITY_MAX, Math.max(QUALITY_MIN, Math.round(value)));
}

function getActivePreset(quality: number): CompressionPresetId {
  if (quality >= COMPRESSION_RANGES.high.min) return "high";
  if (quality >= COMPRESSION_RANGES.medium.min) return "medium";
  return "low";
}

function sliderFillPercent(quality: number) {
  return ((quality - QUALITY_MIN) / (QUALITY_MAX - QUALITY_MIN)) * 100;
}

function zoneWidthPercent(min: number, max: number) {
  return ((max - min) / (QUALITY_MAX - QUALITY_MIN)) * 100;
}

type FormatOption = {
  id: string;
  label: string;
  description: string;
  badge?: { text: string; className: string };
};

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: "original",
    label: "Keep Original Format",
    description: "Do not convert images",
  },
  {
    id: "jpeg",
    label: "JPEG (.jpg)",
    description: "Best for photos and complex images",
  },
  {
    id: "png",
    label: "PNG (.png)",
    description: "Best for logos, icons, and transparency",
  },
  {
    id: "webp",
    label: "WebP (.webp)",
    description: "Smaller size with good quality",
    badge: { text: "Recommended", className: "bg-emerald-100 text-emerald-700" },
  },
  {
    id: "avif",
    label: "AVIF (.avif)",
    description: "Best compression (modern browsers)",
    badge: { text: "Experimental", className: "bg-violet-100 text-violet-700" },
  },
];

function readChannelId(): number {
  try {
    const raw = localStorage.getItem("channel");
    if (!raw) return 1;
    const p = JSON.parse(raw) as { channel_id?: number };
    return typeof p.channel_id === "number" ? p.channel_id : 1;
  } catch {
    return 1;
  }
}

type SettingsRow = {
  channel_id: number;
  is_filename_template_enabled: boolean;
  filename_template: string;
  is_alt_text_template_enabled: boolean;
  alt_text_template: string;
  image_quality: number;
  output_format: string;
  auto_optimize_new_images: boolean;
};

function parseSettings(data: unknown): SettingsRow | null {
  if (!data || typeof data !== "object" || "error" in data) return null;
  const root = data as Record<string, unknown>;
  const d =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const bool = (v: unknown) => {
    if (typeof v === "boolean") return v;
    if (v === 1 || v === "1" || v === "true") return true;
    return false;
  };

  const q = Number(d.image_quality);
  if (
    typeof d.filename_template !== "string" ||
    typeof d.alt_text_template !== "string" ||
    typeof d.output_format !== "string" ||
    !Number.isFinite(q)
  ) {
    return null;
  }

  const cid = Number(d.channel_id);
  return {
    channel_id: Number.isFinite(cid) ? cid : readChannelId(),
    is_filename_template_enabled: bool(d.is_filename_template_enabled),
    filename_template: d.filename_template,
    is_alt_text_template_enabled: bool(d.is_alt_text_template_enabled),
    alt_text_template: d.alt_text_template,
    image_quality: clampQuality(q),
    output_format: d.output_format,
    auto_optimize_new_images: bool(d.auto_optimize_new_images),
  };
}

function applyDefaults(channel: number) {
  return {
    channel_id: channel,
    is_filename_template_enabled: true,
    filename_template: "[name]",
    is_alt_text_template_enabled: true,
    alt_text_template: "[name]",
    image_quality: COMPRESSION_RANGES.high.default,
    output_format: "webp",
    auto_optimize_new_images: true,
  } satisfies SettingsRow;
}

export default function SettingsUI() {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [savePending, setSavePending] = useState(false);
  const [baseline, setBaseline] = useState<SettingsRow | null>(null);

  const [channelId, setChannelId] = useState<number>(() => readChannelId());
  const [isFilenameTemplateEnabled, setIsFilenameTemplateEnabled] =
    useState(true);
  const [filenameTemplate, setFilenameTemplate] = useState("[name]");
  const [isAltTextTemplateEnabled, setIsAltTextTemplateEnabled] = useState(true);
  const [altTextTemplate, setAltTextTemplate] = useState("[name]");
  const [quality, setQuality] = useState<number>(COMPRESSION_RANGES.high.default);
  const activePreset = getActivePreset(quality);
  const [outputFormat, setOutputFormat] = useState<string>("webp");
  const [autoOptimize, setAutoOptimize] = useState(true);

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
    void load();
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (data && typeof data === "object" && "error" in data) return;
      const row = parseSettings(data);
      if (row) pushRow(row);
      else setBaseline(payload);
      toast.success("Settings saved");
    } finally {
      setSavePending(false);
    }
  }

  const setFormatConversionEnabled = (enabled: boolean) => {
    if (enabled) {
      if (outputFormat === "original") {
        setOutputFormat("webp");
      }
    } else {
      setOutputFormat("original");
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-100 p-3 md:p-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
          <div className="flex flex-wrap items-center gap-2">
            {loadState === "loading" && (
              <span className="text-sm text-gray-500">Loading…</span>
            )}
            {loadState === "error" && (
              <span className="text-sm text-amber-700">
                Could not load settings (using defaults).{" "}
                <button
                  type="button"
                  className="font-medium text-blue-600 underline"
                  onClick={() => void load()}
                >
                  Retry
                </button>
              </span>
            )}
            <span className="text-xs text-gray-500 tabular-nums">
              Channel ID: {channelId}
            </span>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={
                savePending ||
                loadState === "loading" ||
                !hasUnsavedChanges
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savePending ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>

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

        <div className="bg-white border rounded-xl shadow-sm p-4 md:p-5">
          <h2 className="font-semibold text-gray-800">Optimization Settings</h2>

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
                  min={QUALITY_MIN}
                  max={QUALITY_MAX}
                  value={quality}
                  onChange={(e) =>
                    setQuality(clampQuality(Number(e.target.value)))
                  }
                  className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer appearance-none bg-transparent [-moz-appearance:none] [-webkit-appearance:none] [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-track]:h-2 [&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:shadow-md"
                  aria-valuemin={QUALITY_MIN}
                  aria-valuemax={QUALITY_MAX}
                  aria-valuenow={quality}
                  aria-label="Image quality percentage"
                />
              </div>

              <div className="relative h-4 text-xs font-medium text-gray-500">
                {[QUALITY_MIN, 65, 80, QUALITY_MAX].map((tick) => (
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
                    onClick={() => setFormatConversionEnabled(!formatConversionEnabled)}
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
                        formatConversionEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Convert To
                    </p>
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
                            disabled={!formatConversionEnabled && opt.id !== "original"}
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
                    <aside className="shrink-0 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-gray-700 lg:w-[13.5rem]">
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

        <div className="bg-white border rounded-xl shadow-sm p-4 space-y-4">
          <h2 className="font-semibold text-gray-700">Cruse Control</h2>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Auto-Optimize New Images
            </span>
            <button
              type="button"
              onClick={() => setAutoOptimize(!autoOptimize)}
              className={`w-12 h-6 flex items-center rounded-full p-1 ${
                autoOptimize ? "bg-blue-600" : "bg-gray-300"
              }`}
              aria-pressed={autoOptimize}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full transform ${
                  autoOptimize ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 px-4">Product Name</th>
                <th>Images Optimized</th>
                <th>Status</th>
                <th>Compression</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Sports Jacket", "12", "success", "Today, 3:15 PM"],
                ["Handbag Set", "8", "success", "Yesterday, 5:40 PM"],
                ["Camera Lens", "15", "failed", "Apr 18, 2:20 PM"],
              ].map((row, i) => (
                <tr key={i} className="border-b last:border-none">
                  <td className="py-2 px-4">{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        row[2] === "success"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {row[2]}
                    </span>
                  </td>
                  <td>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
