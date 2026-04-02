import { z } from "zod";
import { StorefrontConfigSchema } from "@/modules/config/schema";
import type { SearchEntry } from "./types";
import { pathToLabel } from "./field-labels";
import { resolveLocation } from "./field-location-map";

// English sample config is loaded at build time for default-value search
// Import from the project root via tsconfig alias
import sampleConfigEnRaw from "../../../sample-config-import-en.json";

// Fields to skip (metadata, not user-configurable)
const SKIP_FIELDS = new Set(["version", "updatedAt", "channelSlug"]);

// Paths containing these substrings are likely color fields
const COLOR_PATH_HINTS = [
  "color", "Color", "backgroundColor", "textColor", "borderColor",
  "gradientFrom", "gradientTo", "starColor", "starEmptyColor",
  "focusRingColor", "focusBorderColor",
];

/**
 * Detects the field type from a Zod schema node and its path.
 */
function detectFieldType(
  schema: z.ZodTypeAny,
  path: string,
): SearchEntry["fieldType"] {
  const unwrapped = unwrapZod(schema);

  if (unwrapped instanceof z.ZodBoolean) return "boolean";
  if (unwrapped instanceof z.ZodNumber) return "number";
  if (unwrapped instanceof z.ZodEnum || unwrapped instanceof z.ZodNativeEnum) return "enum";
  if (unwrapped instanceof z.ZodArray) return "array";
  if (unwrapped instanceof z.ZodObject) return "object";

  // String field — check if it's a color by path name
  if (unwrapped instanceof z.ZodString) {
    const lastSegment = path.split(".").pop() ?? "";
    if (COLOR_PATH_HINTS.some((hint) => lastSegment.includes(hint))) {
      return "color";
    }
  }

  return "text";
}

/**
 * Unwraps Zod wrappers (optional, nullable, default, branded, effects).
 */
function unwrapZod(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return unwrapZod(schema.unwrap());
  }
  if (schema instanceof z.ZodDefault) {
    return unwrapZod(schema._def.innerType);
  }
  if (schema instanceof z.ZodBranded) {
    return unwrapZod(schema.unwrap());
  }
  if (schema instanceof z.ZodEffects) {
    return unwrapZod(schema._def.schema);
  }
  return schema;
}

/**
 * Recursively walks a Zod object shape and collects all leaf field paths.
 */
function walkZodShape(
  schema: z.ZodTypeAny,
  currentPath: string,
  results: Array<{ path: string; schema: z.ZodTypeAny }>,
  depth = 0,
): void {
  // Safety: prevent infinite recursion
  if (depth > 8) return;

  const unwrapped = unwrapZod(schema);

  if (unwrapped instanceof z.ZodObject) {
    const shape = unwrapped.shape;
    for (const [key, value] of Object.entries(shape)) {
      const childPath = currentPath ? `${currentPath}.${key}` : key;

      // Skip metadata fields at top level
      if (depth === 0 && SKIP_FIELDS.has(key)) continue;

      const childUnwrapped = unwrapZod(value as z.ZodTypeAny);

      if (childUnwrapped instanceof z.ZodObject) {
        // Recurse into nested objects
        walkZodShape(childUnwrapped, childPath, results, depth + 1);
      } else if (childUnwrapped instanceof z.ZodArray) {
        // Register array as a single entry (don't recurse into items)
        results.push({ path: childPath, schema: value as z.ZodTypeAny });
      } else {
        // Leaf field — register it
        results.push({ path: childPath, schema: value as z.ZodTypeAny });
      }
    }
  }
}

/**
 * Extracts default values from the English sample config JSON.
 * Returns a flat map of dot-paths to string values.
 */
function getDefaultValues(): Record<string, string> {
  try {
    const sampleConfig = sampleConfigEnRaw as Record<string, unknown>;
    const config = sampleConfig?.config;
    if (!config || typeof config !== "object") return {};

    const result: Record<string, string> = {};
    flattenObject(config as Record<string, unknown>, "", result);
    return result;
  } catch {
    return {};
  }
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix: string,
  result: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string" && value.length > 0 && value.length <= 100) {
      result[path] = value;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      flattenObject(value as Record<string, unknown>, path, result);
    }
  }
}

/**
 * Generates the comprehensive search index from the Zod schema.
 */
export function generateSearchIndex(): SearchEntry[] {
  const rawFields: Array<{ path: string; schema: z.ZodTypeAny }> = [];
  walkZodShape(StorefrontConfigSchema, "", rawFields);

  const defaultValues = getDefaultValues();
  const entries: SearchEntry[] = [];

  for (const { path, schema } of rawFields) {
    const location = resolveLocation(path);
    if (!location) continue; // Skip fields we can't map to a page

    const fieldType = detectFieldType(schema, path);
    const label = pathToLabel(path);
    const defaultValue = defaultValues[path];

    // Build the breadcrumb description
    const description = `${location.category} > ${location.sectionLabel}`;

    // Derive the form field name by stripping the page-level prefix
    const formFieldName = location.formPrefix
      ? path.slice(location.formPrefix.length)
      : path;

    // Build keywords from path segments
    const pathSegments = path.split(".");
    const keywords = pathSegments
      .filter((s) => !SKIP_FIELDS.has(s))
      .map((s) => s.toLowerCase());

    entries.push({
      fieldPath: path,
      label,
      description,
      defaultValue,
      fieldType,
      page: location.page,
      tab: location.tab,
      sectionId: location.sectionId,
      formFieldName,
      category: location.category,
      keywords,
    });
  }

  // Add quick actions
  entries.push(...QUICK_ACTIONS);

  return entries;
}

/**
 * Quick action entries (not tied to config fields).
 */
const QUICK_ACTIONS: SearchEntry[] = [
  {
    fieldPath: "__action__import",
    label: "Import Configuration",
    description: "Import config from JSON file",
    fieldType: "action",
    page: "index",
    tab: "",
    sectionId: "",
    formFieldName: "",
    category: "Actions",
    keywords: ["import", "json", "upload", "configuration"],
  },
  {
    fieldPath: "__action__export",
    label: "Export Configuration",
    description: "Export current config as JSON",
    fieldType: "action",
    page: "index",
    tab: "",
    sectionId: "",
    formFieldName: "",
    category: "Actions",
    keywords: ["export", "json", "download", "backup"],
  },
];
