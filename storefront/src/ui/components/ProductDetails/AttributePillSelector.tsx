"use client";

import type { SelectionAttributeOption } from "./types";

interface Props {
  options: SelectionAttributeOption[];
  selectedValueId: string | null;
  onSelect: (valueId: string) => void;
  primaryColor: string;
  /** Show size guide button for size-like attributes */
  showSizeGuide?: boolean;
  onSizeGuideClick?: () => void;
  sizeGuideLabel?: string;
}

export function AttributePillSelector({
  options,
  selectedValueId,
  onSelect,
  primaryColor,
  showSizeGuide,
  onSizeGuideClick,
  sizeGuideLabel = "Size Guide",
}: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const isSelected = selectedValueId === opt.valueId;
        const isAvailable = opt.status === "available";
        const isHidden = opt.status === "hidden";
        const isOutOfStock = opt.status === "unavailable";

        return (
          <button
            key={opt.valueId}
            onClick={() => onSelect(opt.valueId)}
            disabled={isHidden}
            className={`relative rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
              isSelected
                ? "border-transparent"
                : isHidden
                  ? "cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-300 line-through"
                  : isOutOfStock
                    ? "border-neutral-200 text-neutral-400 line-through hover:border-neutral-300"
                    : "border-neutral-200 hover:border-neutral-300"
            }`}
            style={
              isSelected
                ? {
                    backgroundColor: `${primaryColor}15`,
                    borderColor: primaryColor,
                    color: primaryColor,
                  }
                : undefined
            }
          >
            {opt.valueName}
            {isAvailable && (opt as any)._lowStock && (
              <span className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-warning-500 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </button>
        );
      })}

      {showSizeGuide && onSizeGuideClick && (
        <button
          type="button"
          onClick={onSizeGuideClick}
          className="ms-2 self-center text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
        >
          {sizeGuideLabel}
        </button>
      )}
    </div>
  );
}
