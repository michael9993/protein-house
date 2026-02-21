"use client";

import type { SelectionAttributeOption } from "./types";

/** Fallback color map when variant has no media */
const FALLBACK_COLORS: Record<string, string> = {
  red: "#ef4444", blue: "#3b82f6", green: "#10b981", yellow: "#fbbf24",
  orange: "#f97316", purple: "#a855f7", pink: "#ec4899", black: "#000000",
  white: "#ffffff", gray: "#6b7280", grey: "#6b7280", brown: "#92400e",
  navy: "#1e3a8a", beige: "#f5f5dc", tan: "#d2b48c", olive: "#808000",
  maroon: "#800000", teal: "#14b8a6", cyan: "#06b6d4", gold: "#ffd700",
  silver: "#c0c0c0", coral: "#ff7f50", indigo: "#6366f1",
};

interface Props {
  options: SelectionAttributeOption[];
  selectedValueId: string | null;
  onSelect: (valueId: string) => void;
  /** Map of value ID → variant image { url, alt } */
  variantMediaByValueId: Map<string, { url: string; alt: string | null }>;
}

export function AttributeImageSwatchSelector({
  options,
  selectedValueId,
  onSelect,
  variantMediaByValueId,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const isSelected = selectedValueId === opt.valueId;
        const isHidden = opt.status === "hidden";
        const isOutOfStock = opt.status === "unavailable";
        const media = variantMediaByValueId.get(opt.valueId);

        return (
          <button
            key={opt.valueId}
            onClick={() => onSelect(opt.valueId)}
            disabled={isHidden}
            className={`group relative flex flex-col items-center gap-2 transition-all ${
              isHidden ? "cursor-not-allowed opacity-30" : isOutOfStock ? "cursor-pointer opacity-60" : "cursor-pointer"
            }`}
            aria-label={`Select ${opt.valueName}${isHidden ? " (unavailable)" : isOutOfStock ? " (out of stock)" : ""}`}
          >
            {/* Image thumbnail or color circle fallback */}
            <div
              className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 shadow-sm transition-all ${
                isSelected
                  ? "scale-110 border-neutral-900 shadow-md"
                  : "border-neutral-300 hover:scale-105 hover:border-neutral-400"
              }`}
            >
              {media ? (
                <img
                  src={media.url}
                  alt={media.alt || opt.valueName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    backgroundColor:
                      opt.hex ||
                      FALLBACK_COLORS[opt.valueName.toLowerCase().trim()] ||
                      "#6b7280",
                  }}
                />
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <svg
                    className="h-5 w-5 drop-shadow-lg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#fff"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Out of stock / hidden diagonal line */}
              {(isHidden || isOutOfStock) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-px w-full rotate-45 bg-neutral-400" />
                </div>
              )}
            </div>

            {/* Color name */}
            <span
              className={`max-w-[68px] text-center text-xs font-medium ${
                isSelected ? "font-semibold text-neutral-900" : "text-neutral-600"
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
