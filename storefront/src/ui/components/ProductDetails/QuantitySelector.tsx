"use client";

interface Props {
  quantity: number;
  onChange: (qty: number) => void;
  max: number;
  disabled?: boolean;
  label?: string;
  maxPerOrderLabel?: string;
}

export function QuantitySelector({
  quantity,
  onChange,
  max,
  disabled = false,
  label = "Qty:",
  maxPerOrderLabel,
}: Props) {
  const effectiveMax = Math.max(1, max);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center">
        <label className="me-3 text-sm font-medium text-neutral-700">{label}</label>
        <div className="flex items-center rounded-lg border border-neutral-300">
          <button
            type="button"
            onClick={() => onChange(Math.max(1, quantity - 1))}
            disabled={disabled || quantity <= 1}
            className="flex h-12 w-12 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            aria-label="Decrease quantity"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <input
            type="number"
            min={1}
            max={effectiveMax}
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              onChange(Math.min(effectiveMax, Math.max(1, val)));
            }}
            disabled={disabled}
            className="w-16 border-x border-neutral-300 py-3 text-center text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => onChange(Math.min(effectiveMax, quantity + 1))}
            disabled={disabled || quantity >= effectiveMax}
            className="flex h-12 w-12 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
            aria-label="Increase quantity"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      {maxPerOrderLabel && (
        <span className="text-xs text-neutral-500">{maxPerOrderLabel}</span>
      )}
    </div>
  );
}
