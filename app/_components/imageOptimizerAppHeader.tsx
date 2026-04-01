"use client";

export type ImageOptimizerStoreOption = {
  value: string;
  label: string;
};

export type ImageOptimizerAppHeaderProps = {
  title?: string;
  onHowItWorksClick?: () => void;
  stores?: ImageOptimizerStoreOption[];
  onStoreChange?: (value: string) => void;
  quotaUsedLabel?: string;
  queueStatusLabel?: string;
  onMenuClick?: () => void;
  className?: string;
};

const defaultStores: ImageOptimizerStoreOption[] = [
  { value: "default", label: "test-store2893.mybigcommerce..." },
];

export default function ImageOptimizerAppHeader({
  title = "Image Optimizer",
  onHowItWorksClick,
  stores = defaultStores,
  onStoreChange,
  quotaUsedLabel = "Quota Used: 650 / ∞",
  queueStatusLabel = "No pending queue",
  onMenuClick,
  className = "",
}: ImageOptimizerAppHeaderProps) {
  const rootClass =
    `flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-5 ${className}`.trim();

  return (
    <div className={rootClass}>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
        <button
          type="button"
          onClick={onHowItWorksClick}
          className="text-xs text-gray-500 cursor-pointer hover:underline bg-transparent border-0 p-0 font-inherit"
        >
          How it works
        </button>
        <select
          className="border text-xs px-2 py-1 rounded"
          defaultValue={stores[0]?.value}
          onChange={(e) => onStoreChange?.(e.target.value)}
          aria-label="Store"
        >
          {stores.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
          {quotaUsedLabel}
        </span>
        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
          {queueStatusLabel}
        </span>
        <button
          type="button"
          onClick={onMenuClick}
          className="border px-2 py-1 rounded hover:bg-gray-100"
          aria-label="Menu"
        >
          ≡
        </button>
      </div>
    </div>
  );
}
