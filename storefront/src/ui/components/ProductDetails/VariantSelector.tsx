"use client";

import { useMemo } from "react";
import type { SelectionAttribute, SelectionState, EnrichedVariant } from "./types";
import { AttributeSwatchSelector } from "./AttributeSwatchSelector";
import { AttributeImageSwatchSelector } from "./AttributeImageSwatchSelector";
import { AttributePillSelector } from "./AttributePillSelector";

const SIZE_SLUGS = new Set([
  "size", "shoe-size", "clothing-size", "apparel-size",
  "shoe_size", "clothing_size", "apparel_size",
]);

const COLOR_SLUGS = new Set(["color", "colour", "color-1"]);

interface Props {
  selectionAttributes: SelectionAttribute[];
  selections: SelectionState;
  onSelect: (attributeSlug: string, valueId: string | null) => void;
  primaryColor: string;
  /** Variants with media — used to build color→image map */
  variants?: EnrichedVariant[];
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
  variants,
  getLabel,
  getValidationMessage,
  showSizeGuide,
  onSizeGuideClick,
  sizeGuideLabel,
}: Props) {
  // Build map: color value ID → first variant image for that color
  const variantMediaByColorValueId = useMemo(() => {
    const map = new Map<string, { url: string; alt: string | null }>();
    if (!variants) return map;

    for (const v of variants) {
      if (!v.media || v.media.length === 0 || !v.attributes) continue;
      for (const attr of v.attributes) {
        if (!COLOR_SLUGS.has(attr.attribute.slug)) continue;
        for (const val of attr.values) {
          if (!map.has(val.id)) {
            map.set(val.id, { url: v.media[0].url, alt: v.media[0].alt });
          }
        }
      }
    }
    return map;
  }, [variants]);

  if (selectionAttributes.length === 0) return null;

  return (
    <div className="space-y-6">
      {selectionAttributes.map((attr) => {
        const selectedValueId = selections[attr.attributeSlug] ?? null;
        const isColorAttr = COLOR_SLUGS.has(attr.attributeSlug);
        const isSwatch = attr.inputType === "SWATCH";
        const isSizeAttribute = SIZE_SLUGS.has(attr.attributeSlug);
        const hasColorImages = isColorAttr && variantMediaByColorValueId.size > 0;
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

            {hasColorImages ? (
              <AttributeImageSwatchSelector
                options={attr.options}
                selectedValueId={selectedValueId}
                onSelect={(valueId) =>
                  onSelect(attr.attributeSlug, selectedValueId === valueId ? null : valueId)
                }
                variantMediaByValueId={variantMediaByColorValueId}
              />
            ) : isSwatch ? (
              <AttributeSwatchSelector
                options={attr.options}
                selectedValueId={selectedValueId}
                onSelect={(valueId) =>
                  onSelect(attr.attributeSlug, selectedValueId === valueId ? null : valueId)
                }
              />
            ) : (
              <AttributePillSelector
                options={attr.options}
                selectedValueId={selectedValueId}
                onSelect={(valueId) =>
                  onSelect(attr.attributeSlug, selectedValueId === valueId ? null : valueId)
                }
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
