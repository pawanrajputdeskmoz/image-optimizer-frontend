"use client";

type AltTextFieldProps = {
  value: string;
  showSave: boolean;
  disabled?: boolean;
  isSaving?: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
};

export default function AltTextField({
  value,
  showSave,
  disabled = false,
  isSaving = false,
  onChange,
  onSave,
}: AltTextFieldProps) {
  return (
    <div className="relative mt-2">
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter alt text"
        className={`w-full rounded border py-2 pl-3 text-sm disabled:cursor-not-allowed disabled:bg-gray-50 ${
          showSave ? "pr-[4.75rem]" : "pr-3"
        }`}
      />

      {showSave ? (
        <button
          type="button"
          disabled={disabled || isSaving}
          onClick={onSave}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded bg-black px-2.5 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      ) : null}
    </div>
  );
}
