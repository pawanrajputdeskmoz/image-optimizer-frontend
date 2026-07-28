import { readChannelId } from "@/app/_lib/channelStorage";

export const QUALITY_MIN = 50;
export const QUALITY_MAX = 100;

export const COMPRESSION_RANGES = {
  low: { min: 50, max: 65, default: 57, label: "Smallest" },
  medium: { min: 65, max: 80, default: 72, label: "Balanced" },
  high: { min: 80, max: 100, default: 90, label: "Lossless" },
} as const;

export type CompressionPresetId = keyof typeof COMPRESSION_RANGES;

export const COMPRESSION_PRESET_ORDER: CompressionPresetId[] = [
  "low",
  "medium",
  "high",
];

export type FormatOption = {
  id: string;
  label: string;
  description: string;
  badge?: { text: string; className: string };
};

/** Formats shown in the modal 2×2 grid (matches design). */
export const FORMAT_OPTIONS: FormatOption[] = [
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
    badge: {
      text: "Recommended",
      className: "bg-emerald-100 text-emerald-700",
    },
  },
];

export type SettingsRow = {
  channel_id: number;
  is_filename_template_enabled: boolean;
  filename_template: string;
  is_alt_text_template_enabled: boolean;
  alt_text_template: string;
  image_quality: number;
  output_format: string;
  auto_optimize_new_images: boolean;
  auto_optimize_new_category_images: boolean;
};

export function clampQuality(value: number) {
  return Math.min(QUALITY_MAX, Math.max(QUALITY_MIN, Math.round(value)));
}

export function getActivePreset(quality: number): CompressionPresetId {
  if (quality >= COMPRESSION_RANGES.high.min) return "high";
  if (quality >= COMPRESSION_RANGES.medium.min) return "medium";
  return "low";
}

export function getPresetBadgeLabel(quality: number) {
  const preset = getActivePreset(quality);
  const label = COMPRESSION_RANGES[preset].label.toUpperCase();
  return `${quality}% ${label === "LOSSLESS" ? "HIGH" : label}`;
}

export function sliderFillPercent(quality: number) {
  return ((quality - QUALITY_MIN) / (QUALITY_MAX - QUALITY_MIN)) * 100;
}

export function parseSettings(data: unknown): SettingsRow | null {
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
    auto_optimize_new_category_images: bool(
      d.auto_optimize_new_category_images,
    ),
  };
}

export function applyDefaults(channel: number): SettingsRow {
  return {
    channel_id: channel,
    is_filename_template_enabled: true,
    filename_template: "[name]",
    is_alt_text_template_enabled: true,
    alt_text_template: "[name]",
    image_quality: COMPRESSION_RANGES.high.default,
    output_format: "webp",
    auto_optimize_new_images: true,
    auto_optimize_new_category_images: true,
  };
}
