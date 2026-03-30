"use client";

export default function ImageOptimizerSettingsPage({
  onClose,
}: {
  onClose?: () => void;
}) {
  return (
    <div className="p-3">
      <p className="mb-0 text-sm text-zinc-600">
        Image optimizer settings (quality, naming, alt text) can be configured
        here once wired to your backend.
      </p>
      {onClose ? (
        <button
          type="button"
          className="mt-3 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          onClick={onClose}
        >
          Close
        </button>
      ) : null}
    </div>
  );
}
