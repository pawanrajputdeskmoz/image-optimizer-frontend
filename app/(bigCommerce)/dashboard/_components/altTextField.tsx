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
    <div className="custom-input relative">
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="alt text here"
        className={`form-control ${
          showSave ? "pr-[4.75rem]" : ""
        }`}
      />

      {showSave ? (
        <button
          type="button"
          disabled={disabled || isSaving}
          onClick={onSave}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 custom-btn !h-6 !px-2.5 !text-[11px]"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      ) : null}
    </div>
  );
}
