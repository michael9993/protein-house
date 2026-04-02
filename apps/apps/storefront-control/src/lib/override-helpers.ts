/**
 * Helpers for converting between flat dot-key format ("homepage.hero")
 * used in config storage and nested object format used by React Hook Form.
 *
 * RHF interprets dots in field paths as nested object access, so config keys
 * like "homepage.hero" must be converted to { homepage: { hero: ... } } for
 * the form, then flattened back before saving.
 */

/** "homepage.hero": {bg:"#f"} → { homepage: { hero: {bg:"#f"} } } */
export function nestOverrides(flat: Record<string, unknown>): Record<string, unknown> {
  const nested: Record<string, Record<string, unknown>> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (!value || typeof value !== "object") continue;
    const dot = key.indexOf(".");
    if (dot > 0) {
      const prefix = key.substring(0, dot);
      const suffix = key.substring(dot + 1);
      if (!nested[prefix]) nested[prefix] = {};
      nested[prefix][suffix] = value;
    } else {
      nested[key] = value as Record<string, unknown>;
    }
  }
  return nested;
}

/** { homepage: { hero: {bg:"#f"} } } → "homepage.hero": {bg:"#f"} */
export function flattenOverrides(nested: Record<string, unknown>): Record<string, Record<string, unknown>> {
  const flat: Record<string, Record<string, unknown>> = {};
  for (const [prefix, group] of Object.entries(nested)) {
    if (!group || typeof group !== "object") continue;
    for (const [suffix, maybeStyle] of Object.entries(group as Record<string, unknown>)) {
      if (maybeStyle && typeof maybeStyle === "object" && !Array.isArray(maybeStyle)) {
        flat[`${prefix}.${suffix}`] = maybeStyle as Record<string, unknown>;
      }
    }
  }
  return flat;
}

/** Resolve a dot-key from nested overrides: "homepage.hero" → nested.homepage.hero */
export function getNestedOverride(
  nested: Record<string, unknown>,
  dotKey: string
): Record<string, unknown> | undefined {
  const dot = dotKey.indexOf(".");
  if (dot <= 0) return nested[dotKey] as Record<string, unknown> | undefined;
  const prefix = dotKey.substring(0, dot);
  const suffix = dotKey.substring(dot + 1);
  const group = nested[prefix] as Record<string, unknown> | undefined;
  return group?.[suffix] as Record<string, unknown> | undefined;
}
