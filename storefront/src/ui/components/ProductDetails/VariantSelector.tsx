"use client";

import type { SelectionAttribute, SelectionState } from "./types";
import { AttributeSwatchSelector } from "./AttributeSwatchSelector";
import { AttributePillSelector } from "./AttributePillSelector";

const SIZE_SLUGS = new Set(["size", "shoe-size", "clothing-size", "shoe_size", "clothing_size"]);

interface Props {
  selectionAttributes: SelectionAttribute[];
  selections: SelectionState;
  onSelect: (attributeSlug: string, valueId: string) => void;
  primaryColor: string;
  /** Text label generator, receives attribute name, returns label */
  getLabel?: (attributeName: string) => string;
  /** Validation message generator, receives attribute name */
  getValidationMessage?: (attributeName: string) => string;
  /** Size guide */
  showSizeGuide?: boolean;
  onSizeGuideClick?: () => void;
  sizeGuideLabel?: string;
}

export function VariantSelector({
  selectionAttributes,
  selections,
  onSelect,
  primaryColor,
  getLabel,
  getValidationMessage,
  showSizeGuide,
  onSizeGuideClick,
  sizeGuideLabel,
}: Props) {
  if (selectionAttributes.length === 0) return null;

  return (
    <div className="space-y-6">
      {selectionAttributes.map((attr) => {
        const selectedValueId = selections[attr.attributeSlug] ?? null;
        const isSwatch = attr.inputType === "SWATCH";
        const isSizeAttribute = SIZE_SLUGS.has(attr.attributeSlug);
        const label = getLabel
          ? getLabel(attr.attributeName)
          : attr.attributeName;

        return (
          <div key={attr.attributeId}>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-900">
                {label}
                {!selectedValueId && (
                  <span className="ms-1 text-red-500">*</span>
                )}
              </label>
              {isSizeAttribute && showSizeGuide && onSizeGuideClick && (
                <button
                  type="button"
                  onClick={onSizeGuideClick}
                  className="text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-700"
                >
                  {sizeGuideLabel}
                </button>
              )}
            </div>

            {isSwatch ? (
              <AttributeSwatchSelector
                options={attr.options}
                selectedValueId={selectedValueId}
                onSelect={(valueId) => onSelect(attr.attributeSlug, valueId)}
              />
            ) : (
              <AttributePillSelector
                options={attr.options}
                selectedValueId={selectedValueId}
                onSelect={(valueId) => onSelect(attr.attributeSlug, valueId)}
                primaryColor={primaryColor}
              />
            )}

            {!selectedValueId && getValidationMessage && (
              <p className="mt-2 text-sm text-red-500">
                {getValidationMessage(attr.attributeName)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
