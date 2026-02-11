"use client";

import type { SelectionAttributeOption } from "./types";

/** Fallback color map for when Saleor doesn't have a hex value */
const FALLBACK_COLORS: Record<string, string> = {
  red: "#ef4444", blue: "#3b82f6", green: "#10b981", yellow: "#fbbf24",
  orange: "#f97316", purple: "#a855f7", pink: "#ec4899", black: "#000000",
  white: "#ffffff", gray: "#6b7280", grey: "#6b7280", brown: "#92400e",
  navy: "#1e3a8a", beige: "#f5f5dc", tan: "#d2b48c", olive: "#808000",
  maroon: "#800000", teal: "#14b8a6", cyan: "#06b6d4", gold: "#ffd700",
  silver: "#c0c0c0", coral: "#ff7f50", indigo: "#6366f1",
};

function getHex(option: SelectionAttributeOption): string {
  if (option.hex) return option.hex;
  return FALLBACK_COLORS[option.valueName.toLowerCase().trim()] ?? "#6b7280";
}

interface Props {
  options: SelectionAttributeOption[];
  selectedValueId: string | null;
  onSelect: (valueId: string) => void;
}

export function AttributeSwatchSelector({ options, selectedValueId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const isSelected = selectedValueId === opt.valueId;
        const isHidden = opt.status === "hidden";
        const isOutOfStock = opt.status === "unavailable";
        const hex = getHex(opt);

        return (
          <button
            key={opt.valueId}
            onClick={() => onSelect(opt.valueId)}
            disabled={isHidden}
            className={`group relative flex flex-col items-center gap-2 transition-all ${
              isHidden ? "opacity-30 cursor-not-allowed" : isOutOfStock ? "opacity-60 cursor-pointer" : "cursor-pointer"
            }`}
            aria-label={`Select color ${opt.valueName}${isHidden ? " (unavailable)" : isOutOfStock ? " (out of stock)" : ""}`}
          >
            {/* Swatch circle */}
            <div
              className={`relative h-12 w-12 rounded-lg border-2 shadow-sm transition-all ${
                isSelected
                  ? "border-neutral-900 scale-110 shadow-md"
                  : "border-neutral-300 hover:border-neutral-400 hover:scale-105"
              }`}
              style={{ backgroundColor: hex }}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="h-5 w-5 drop-shadow-lg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={hex === "#ffffff" || hex === "#ffd700" || hex === "#fbbf24" ? "#000" : "#fff"}
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {(isHidden || isOutOfStock) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-px w-full bg-neutral-400 rotate-45" />
                </div>
              )}
            </div>
            {/* Color name */}
            <span
              className={`text-xs font-medium text-center max-w-[60px] ${
                isSelected ? "text-neutral-900 font-semibold" : "text-neutral-600"
              }`}
            >
              {opt.valueName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
