"use client";

import { useState } from "react";
import { FileText, Gauge, Rocket, type LucideIcon } from "lucide-react";

type OptimizationModeId =
  | "optimize_and_alt"
  | "optimize_only"
  | "alt_only";

type OptimizationModeOption = {
  id: OptimizationModeId;
  title: string;
  description: string;
  icon: LucideIcon;
};

const OPTIMIZATION_MODE_OPTIONS: OptimizationModeOption[] = [
  {
    id: "optimize_and_alt",
    title: "Image Optimization + Alt Text Generation",
    description: "Recommended for best performance and SEO.",
    icon: Rocket,
  },
  {
    id: "optimize_only",
    title: "Image Optimization Only",
    description: "Fast image optimization.",
    icon: Gauge,
  },
  {
    id: "alt_only",
    title: "Generate Alt Text Only",
    description: "Settings-based alt text generation.",
    icon: FileText,
  },
];

function ModeOption({
  option,
  selected,
  onSelect,
}: {
  option: OptimizationModeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;

  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border bg-white p-3.5 transition-colors ${
        selected
          ? "border-[#5D5FEF] bg-[#FDFDFD]"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <input
        type="radio"
        name="optimizationMode"
        value={option.id}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${
          selected ? "bg-[#5D5FEF] text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#303030]">
          {option.title}
        </span>
        <span
          className={`mt-1 block text-xs leading-snug ${
            selected ? "text-[#303030]" : "text-gray-500"
          }`}
        >
          {option.description}
        </span>
      </span>
      <span
        className={`mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-[#303030] bg-[#303030]"
            : "border-gray-300 bg-white"
        }`}
        aria-hidden
      >
        {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
      </span>
    </label>
  );
}

export default function OptimizationModeCard() {
  const [selectedMode, setSelectedMode] =
    useState<OptimizationModeId>("optimize_and_alt");

  const [primaryOption, ...secondaryOptions] = OPTIMIZATION_MODE_OPTIONS;

  return (
    <div className="card mb-0! shadow-none!">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#303030]">
          Optimization Mode
        </h2>
        <p className="mt-1 mb-0 text-xs font-normal text-[#616161]">
          Choose what runs when images are processed
        </p>
      </div>

      <div className="space-y-3">
        <ModeOption
          option={primaryOption}
          selected={selectedMode === primaryOption.id}
          onSelect={() => setSelectedMode(primaryOption.id)}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {secondaryOptions.map((option) => (
            <ModeOption
              key={option.id}
              option={option}
              selected={selectedMode === option.id}
              onSelect={() => setSelectedMode(option.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
