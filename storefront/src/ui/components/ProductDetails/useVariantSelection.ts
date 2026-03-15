import { useState, useMemo, useCallback, useEffect } from "react";
import type {
  EnrichedVariant,
  SelectionState,
  SelectionAttribute,
  SelectionAttributeOption,
} from "./types";

interface UseVariantSelectionProps {
  variants: EnrichedVariant[];
  /** Slugs of attributes marked VARIANT_SELECTION in the product type */
  variantSelectionSlugs: string[];
  /** Initial variant id from URL ?variant= */
  initialVariantId?: string;
}

interface UseVariantSelectionReturn {
  /** Ordered list of selection dimensions */
  selectionAttributes: SelectionAttribute[];
  /** Current selection state (slug → value ID or null) */
  selections: SelectionState;
  /** Callback to set (or clear with null) a value for an attribute */
  selectValue: (attributeSlug: string, valueId: string | null) => void;
  /** The fully-resolved variant (null if selection incomplete or no match) */
  selectedVariant: EnrichedVariant | null;
  /** True when all required attributes have a value and resolve to a variant */
  isSelectionComplete: boolean;
  /** True when the product has variant selection attributes (i.e. needs user selection) */
  needsSelection: boolean;
}

/** Clothing size sort order */
const CLOTHING_SIZE_ORDER: Record<string, number> = {
  xxs: 0, xs: 1, s: 2, m: 3, l: 4, xl: 5, xxl: 6, xxxl: 7, "2xl": 6, "3xl": 7, "4xl": 8,
};

function sortOptions(options: SelectionAttributeOption[]): SelectionAttributeOption[] {
  return [...options].sort((a, b) => {
    const aKey = a.valueSlug.toLowerCase();
    const bKey = b.valueSlug.toLowerCase();

    // Clothing sizes
    const aOrder = CLOTHING_SIZE_ORDER[aKey];
    const bOrder = CLOTHING_SIZE_ORDER[bKey];
    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;

    // Numeric sizes
    const aNum = parseFloat(aKey);
    const bNum = parseFloat(bKey);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;

    // Alphabetical fallback
    return aKey.localeCompare(bKey);
  });
}

/**
 * Generic hook for dynamic variant selection.
 *
 * Replaces all hardcoded color/size logic. Works with any number of
 * VARIANT_SELECTION attributes defined in the product type.
 */
export function useVariantSelection({
  variants,
  variantSelectionSlugs,
  initialVariantId,
}: UseVariantSelectionProps): UseVariantSelectionReturn {
  // 1. Identify selection attribute slugs from product type
  const selectionSlugs = useMemo(() => {
    // Collect slugs that actually have values across this product's variants
    const slugsWithValues = new Set<string>();
    for (const v of variants) {
      if (!v.attributes) continue;
      for (const attr of v.attributes) {
        if (attr.values && attr.values.length > 0) {
          slugsWithValues.add(attr.attribute.slug);
        }
      }
    }

    let slugs: string[];
    if (variantSelectionSlugs.length > 0) {
      // Use product type order, but filter to only attributes with actual values
      slugs = variantSelectionSlugs.filter((s) => slugsWithValues.has(s));
    } else {
      slugs = Array.from(slugsWithValues);
    }

    // Sort: color-like attributes first, then size-like, then alphabetical.
    // This ensures the cascade (select color → then size) works naturally.
    const COLOR_SLUGS = new Set(["color", "colour", "color-1"]);
    const SIZE_SLUGS = new Set([
      "size", "pet-size", "clothing-size", "apparel-size",
      "pet_size", "clothing_size", "apparel_size",
    ]);
    return slugs.sort((a, b) => {
      const aColor = COLOR_SLUGS.has(a) ? 0 : 2;
      const bColor = COLOR_SLUGS.has(b) ? 0 : 2;
      const aSize = SIZE_SLUGS.has(a) ? 1 : 2;
      const bSize = SIZE_SLUGS.has(b) ? 1 : 2;
      const aPrio = Math.min(aColor, aSize);
      const bPrio = Math.min(bColor, bSize);
      if (aPrio !== bPrio) return aPrio - bPrio;
      return a.localeCompare(b);
    });
  }, [variantSelectionSlugs, variants]);

  // 2. Build unique values per attribute from all variants
  const { attrMeta, variantIndex, valueLookup, variantsById } = useMemo(() => {
    const meta = new Map<
      string,
      {
        attributeId: string;
        attributeName: string;
        inputType: string;
        valuesMap: Map<string, { name: string; slug: string; hex: string | null }>;
      }
    >();

    // Index: for each variant, store its attribute value IDs keyed by slug
    const vIndex = new Map<string, Map<string, string>>(); // variant id → (attr slug → value id)

    for (const v of variants) {
      const vMap = new Map<string, string>();
      if (v.attributes) {
        for (const attr of v.attributes) {
          if (!selectionSlugs.includes(attr.attribute.slug)) continue;
          const slug = attr.attribute.slug;
          if (!meta.has(slug)) {
            meta.set(slug, {
              attributeId: attr.attribute.id,
              attributeName: attr.attribute.name,
              inputType: attr.attribute.inputType || "DROPDOWN",
              valuesMap: new Map(),
            });
          }
          const m = meta.get(slug)!;
          for (const val of attr.values) {
            if (!m.valuesMap.has(val.id)) {
              m.valuesMap.set(val.id, {
                name: val.name,
                slug: val.slug,
                hex: val.value,
              });
            }
            // Use first value for the selection dimension
            vMap.set(slug, val.id);
          }
        }
      }
      vIndex.set(v.id, vMap);
    }

    // Reverse lookup: "slug:valueId" → Set of variant IDs that have this value
    const vLookup = new Map<string, Set<string>>();
    for (const v of variants) {
      const vMap = vIndex.get(v.id);
      if (!vMap) continue;
      for (const [slug, valueId] of vMap.entries()) {
        const key = `${slug}:${valueId}`;
        if (!vLookup.has(key)) vLookup.set(key, new Set());
        vLookup.get(key)!.add(v.id);
      }
    }

    // Fast variant lookup by ID
    const vById = new Map<string, (typeof variants)[0]>();
    for (const v of variants) vById.set(v.id, v);

    return { attrMeta: meta, variantIndex: vIndex, valueLookup: vLookup, variantsById: vById };
  }, [variants, selectionSlugs]);

  // 3. Build initial selections from URL variant
  const initialSelections = useMemo((): SelectionState => {
    const state: SelectionState = {};
    for (const slug of selectionSlugs) {
      state[slug] = null;
    }

    if (initialVariantId) {
      const vMap = variantIndex.get(initialVariantId);
      if (vMap) {
        for (const [slug, valueId] of vMap.entries()) {
          state[slug] = valueId;
        }
      }
    }

    // If no initial variant, auto-select first available variant for single-variant products
    if (!initialVariantId && variants.length === 1) {
      const v = variants[0];
      const vMap = variantIndex.get(v.id);
      if (vMap) {
        for (const [slug, valueId] of vMap.entries()) {
          state[slug] = valueId;
        }
      }
    }

    return state;
  }, [selectionSlugs, initialVariantId, variantIndex, variants]);

  const [selections, setSelections] = useState<SelectionState>(initialSelections);

  // Sync selections when initialVariantId changes (URL navigation)
  useEffect(() => {
    if (!initialVariantId) return;
    const vMap = variantIndex.get(initialVariantId);
    if (!vMap) return;
    setSelections((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [slug, valueId] of vMap.entries()) {
        if (next[slug] !== valueId) {
          next[slug] = valueId;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [initialVariantId, variantIndex]);

  // 4. Compute option availability per attribute given current selections.
  //    Forward-only cascade: each attribute's availability is constrained only by
  //    attributes that come BEFORE it in the selection order. This prevents
  //    downstream auto-selections (e.g. color) from locking upstream choices (e.g. size).
  const selectionAttributes = useMemo((): SelectionAttribute[] => {
    const orderedSlugs = selectionSlugs.filter((s) => attrMeta.has(s));

    return orderedSlugs.map((slug, attrIndex) => {
      const meta = attrMeta.get(slug)!;
      const options: SelectionAttributeOption[] = [];

      for (const [valueId, valInfo] of meta.valuesMap.entries()) {
        let hasMatchWithStock = false;
        let hasMatchWithoutStock = false;

        const candidateIds = valueLookup.get(`${slug}:${valueId}`);
        if (candidateIds) {
          for (const vId of candidateIds) {
            const vMap = variantIndex.get(vId);
            if (!vMap) continue;

            // Only check selections for attributes BEFORE this one in the order.
            // If the variant doesn't have a given attribute at all, skip that check —
            // the variant simply doesn't use that dimension (e.g. color-only variant
            // in a product type that also defines size).
            let priorMatch = true;
            for (let j = 0; j < attrIndex; j++) {
              const priorSlug = orderedSlugs[j];
              const priorValue = selections[priorSlug];
              if (!priorValue) continue;
              const variantValue = vMap.get(priorSlug);
              if (variantValue === undefined) continue; // variant doesn't have this attr — skip
              if (variantValue !== priorValue) {
                priorMatch = false;
                break;
              }
            }

            if (priorMatch) {
              const v = variantsById.get(vId);
              if (v && v.quantityAvailable > 0) {
                hasMatchWithStock = true;
                break;
              } else {
                hasMatchWithoutStock = true;
              }
            }
          }
        }

        let status: SelectionAttributeOption["status"];
        if (hasMatchWithStock) {
          status = "available";
        } else if (hasMatchWithoutStock) {
          status = "unavailable";
        } else {
          status = "hidden";
        }

        options.push({
          valueId,
          valueName: valInfo.name,
          valueSlug: valInfo.slug,
          hex: valInfo.hex,
          status,
        });
      }

      return {
        attributeId: meta.attributeId,
        attributeSlug: slug,
        attributeName: meta.attributeName,
        inputType: meta.inputType,
        options: sortOptions(options),
      };
    });
  }, [selectionSlugs, attrMeta, variantIndex, valueLookup, variantsById, selections]);

  // 5. Select value handler — cascade reset attributes after this one
  const selectValue = useCallback(
    (attributeSlug: string, valueId: string | null) => {
      setSelections((prev) => {
        const next = { ...prev };
        next[attributeSlug] = valueId;

        // If deselecting, clear this and all downstream attributes
        if (valueId === null) {
          const idx = selectionSlugs.indexOf(attributeSlug);
          if (idx >= 0) {
            for (let i = idx; i < selectionSlugs.length; i++) {
              next[selectionSlugs[i]] = null;
            }
          }
          return next;
        }

        // Cascade: clear all attributes that come AFTER this one
        const idx = selectionSlugs.indexOf(attributeSlug);
        if (idx >= 0) {
          for (let i = idx + 1; i < selectionSlugs.length; i++) {
            next[selectionSlugs[i]] = null;
          }
        }

        // Auto-select next attribute if only one option is available
        for (let i = idx + 1; i < selectionSlugs.length; i++) {
          const slug = selectionSlugs[i];
          const attrInfo = attrMeta.get(slug);
          if (!attrInfo) continue;

          // Find available options for this attribute given current selections + the just-set value.
          // Skip attributes the variant doesn't carry (e.g. color-only variant has no size).
          const availableValueIds: string[] = [];
          for (const [vId] of attrInfo.valuesMap.entries()) {
            const candidateIds = valueLookup.get(`${slug}:${vId}`);
            if (!candidateIds) continue;
            let found = false;
            for (const cId of candidateIds) {
              const vMap = variantIndex.get(cId);
              if (!vMap) continue;
              let allMatch = true;
              for (const [otherSlug, otherVal] of Object.entries(next)) {
                if (otherSlug === slug || !otherVal) continue;
                const variantValue = vMap.get(otherSlug);
                if (variantValue === undefined) continue; // variant doesn't have this attr
                if (variantValue !== otherVal) {
                  allMatch = false;
                  break;
                }
              }
              const v = variantsById.get(cId);
              if (allMatch && v && v.quantityAvailable > 0) {
                availableValueIds.push(vId);
                found = true;
                break;
              }
            }
          }

          if (availableValueIds.length === 1) {
            next[slug] = availableValueIds[0];
          } else {
            break; // Stop auto-selecting if ambiguous
          }
        }

        return next;
      });
    },
    [selectionSlugs, attrMeta, variantIndex, valueLookup, variantsById]
  );

  // 6. Resolve selected variant.
  //    A variant matches when every attribute it actually has is selected and matches.
  //    Attributes the variant doesn't carry are skipped (e.g. color-only variant in
  //    a product type that also defines size).
  const selectedVariant = useMemo((): EnrichedVariant | null => {
    // At least one selection must be made
    const hasAnySelection = selectionSlugs.some((s) => selections[s]);
    if (!hasAnySelection) return null;

    for (const v of variants) {
      const vMap = variantIndex.get(v.id);
      if (!vMap) continue;

      let matches = true;
      let matchedDimensions = 0;

      for (const slug of selectionSlugs) {
        const variantValue = vMap.get(slug);
        const selectedValue = selections[slug];

        if (variantValue === undefined) {
          // Variant doesn't have this attribute — skip dimension
          continue;
        }

        // Variant has this attribute: it MUST be selected and match
        if (!selectedValue || variantValue !== selectedValue) {
          matches = false;
          break;
        }
        matchedDimensions++;
      }

      // Must have matched at least the attributes this variant actually has
      if (matches && matchedDimensions === vMap.size) return v;
    }

    return null;
  }, [selections, selectionSlugs, variants, variantIndex]);

  const needsSelection = selectionSlugs.length > 0 && variants.length > 1;
  const isSelectionComplete = selectedVariant !== null;

  return {
    selectionAttributes,
    selections,
    selectValue,
    selectedVariant,
    isSelectionComplete,
    needsSelection,
  };
}
