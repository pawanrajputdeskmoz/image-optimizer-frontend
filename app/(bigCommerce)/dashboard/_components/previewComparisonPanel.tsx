"use client";

export type PreviewComparisonRow = {
  label: string;
  before: string;
  after: string;
  savedPercentage?: number | null;
};

export default function PreviewComparisonPanel({
  rows,
  loading = false,
}: {
  rows: PreviewComparisonRow[];
  loading?: boolean;
}) {
  if (loading) {
    return <div className="h-14 animate-pulse rounded border border-gray-100 bg-gray-50" />;
  }

  return (
    <dl className="divide-y divide-gray-100 rounded-md border border-gray-100 text-[11px] leading-tight sm:text-xs">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[3.5rem_1fr_auto_1fr] items-start gap-x-1.5 px-2 py-1.5 sm:grid-cols-[4rem_1fr_auto_1fr] sm:gap-x-2 sm:px-2.5"
        >
          <dt className="pt-px font-medium text-gray-500">{row.label}</dt>
          <dd className="min-w-0 break-words text-gray-500">{row.before}</dd>
          <span className="pt-px text-gray-300" aria-hidden>
            →
          </span>
          <dd className="min-w-0 break-words text-gray-800">
            {row.after}
            {row.label === "Size" && typeof row.savedPercentage === "number" ? (
              <span className="ml-1 text-emerald-600">
                (-{row.savedPercentage}%)
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
