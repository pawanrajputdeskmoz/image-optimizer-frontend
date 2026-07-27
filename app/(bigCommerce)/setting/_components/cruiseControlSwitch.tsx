"use client";

type CruiseControlSwitchProps = {
  label: string;
  enabled: boolean;
  pending: boolean;
  disabled?: boolean;
  onToggle: () => void;
  ariaLabels: { on: string; off: string; busy: string };
};

export default function CruiseControlSwitch({
  label,
  enabled,
  pending,
  disabled,
  onToggle,
  ariaLabels,
}: CruiseControlSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-busy={pending}
        aria-label={pending ? ariaLabels.busy : enabled ? ariaLabels.off : ariaLabels.on}
        disabled={disabled || pending}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          enabled ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        {pending ? (
          <span
            className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden
          />
        ) : (
          <span
            className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        )}
      </button>
    </div>
  );
}
