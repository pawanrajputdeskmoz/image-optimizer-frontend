"use client";

type VcToggleSwitchProps = {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  pending?: boolean;
  disabled?: boolean;
};

export default function VcToggleSwitch({
  enabled,
  onToggle,
  label,
  pending = false,
  disabled = false,
}: VcToggleSwitchProps) {
  const isDisabled = disabled || pending;

  return (
    <div
      className={`vc-toggle-container static! shrink-0 ${
        isDisabled ? "pointer-events-none opacity-60" : ""
      }`}
    >
      <label className="vc-small-switch">
        <input
          type="checkbox"
          checked={enabled}
          className="vc-switch-input"
          aria-label={label}
          aria-busy={pending}
          disabled={isDisabled}
          onChange={() => {
            if (isDisabled) return;
            onToggle();
          }}
        />
        <span className="vc-switch-label" data-on="ON" data-off="OFF" />
        <span className="vc-switch-handle" />
      </label>
    </div>
  );
}
