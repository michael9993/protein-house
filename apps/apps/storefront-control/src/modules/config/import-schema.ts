import { z } from "zod";

import { StorefrontConfig, StorefrontConfigSchema } from "./schema";

/**
 * Current schema version for import/export files.
 * Increment when making breaking changes to the config schema.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Schema for import file metadata wrapper
 */
export const ImportFileSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: z.string().optional(),
  channelSlug: z.string().optional(),
  config: StorefrontConfigSchema,
});

export type ImportFile = z.infer<typeof ImportFileSchema>;

/**
 * Validation result for import files
 */
export interface ImportValidationResult {
  valid: boolean;
  errors: ImportValidationError[];
  warnings: string[];
  config?: StorefrontConfig;
}

export interface ImportValidationError {
  path: string;
  message: string;
}

/**
 * Validate an import file and return detailed errors
 */
export function validateImportFile(data: unknown): ImportValidationResult {
  const errors: ImportValidationError[] = [];
  const warnings: string[] = [];

  // Check if data is an object
  if (!data || typeof data !== "object") {
    return {
      valid: false,
      errors: [{ path: "", message: "Import file must be a valid JSON object" }],
      warnings: [],
    };
  }

  const obj = data as Record<string, unknown>;

  // Check schemaVersion
  if (!("schemaVersion" in obj)) {
    errors.push({ path: "schemaVersion", message: "Missing required field: schemaVersion" });
  } else if (typeof obj.schemaVersion !== "number") {
    errors.push({ path: "schemaVersion", message: "schemaVersion must be a number" });
  } else if (obj.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    errors.push({
      path: "schemaVersion",
      message: `Unsupported schema version: ${obj.schemaVersion}. Expected: ${CURRENT_SCHEMA_VERSION}`,
    });
  }

  // Check config exists
  if (!("config" in obj)) {
    errors.push({ path: "config", message: "Missing required field: config" });
    return { valid: false, errors, warnings };
  }

  // Check for unknown top-level fields (strict mode)
  const allowedFields = ["schemaVersion", "exportedAt", "channelSlug", "config"];
  for (const key of Object.keys(obj)) {
    if (!allowedFields.includes(key)) {
      errors.push({ path: key, message: `Unknown field: ${key}. Remove it before importing.` });
    }
  }

  // If we have critical errors, return early
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Validate the config against the full schema
  const result = StorefrontConfigSchema.safeParse(obj.config);

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({
        path: `config.${issue.path.join(".")}`,
        message: issue.message,
      });
    }
    return { valid: false, errors, warnings };
  }

  // Add warnings for optional fields
  if (obj.channelSlug) {
    warnings.push(`File specifies channel "${obj.channelSlug}" - config will be applied to the selected channel`);
  }

  return {
    valid: true,
    errors: [],
    warnings,
    config: result.data,
  };
}

/**
 * Config diff entry representing a changed field
 */
export interface ConfigDiffEntry {
  path: string;
  section: string;
  field: string;
  currentValue: unknown;
  newValue: unknown;
}

/**
 * Sections whose values are "flat records" — keys may contain dots
 * (e.g., "homepage.hero") and should be compared as atomic objects,
 * not recursed into by the dot-path traversal.
 */
const FLAT_RECORD_SECTIONS = new Set(["componentOverrides", "cardOverrides"]);

/**
 * Compare two configs and return the differences
 */
export function diffConfigs(
  current: StorefrontConfig,
  incoming: StorefrontConfig
): ConfigDiffEntry[] {
  const diffs: ConfigDiffEntry[] = [];

  function compare(
    currentObj: unknown,
    incomingObj: unknown,
    path: string,
    section: string
  ): void {
    // Handle primitive values
    if (typeof currentObj !== "object" || currentObj === null) {
      if (currentObj !== incomingObj) {
        const parts = path.split(".");
        diffs.push({
          path,
          section,
          field: parts[parts.length - 1],
          currentValue: currentObj,
          newValue: incomingObj,
        });
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(currentObj)) {
      if (!Array.isArray(incomingObj)) {
        diffs.push({
          path,
          section,
          field: path.split(".").pop() || "",
          currentValue: currentObj,
          newValue: incomingObj,
        });
        return;
      }

      // Compare arrays by JSON stringification for simplicity
      if (JSON.stringify(currentObj) !== JSON.stringify(incomingObj)) {
        diffs.push({
          path,
          section,
          field: path.split(".").pop() || "",
          currentValue: currentObj,
          newValue: incomingObj,
        });
      }
      return;
    }

    // Handle objects
    if (typeof incomingObj !== "object" || incomingObj === null) {
      diffs.push({
        path,
        section,
        field: path.split(".").pop() || "",
        currentValue: currentObj,
        newValue: incomingObj,
      });
      return;
    }

    // Detect flat-record sections: compare each entry as an atomic object
    const sectionKey = path.split(".").pop() || "";
    if (FLAT_RECORD_SECTIONS.has(sectionKey)) {
      compareFlatRecord(
        currentObj as Record<string, unknown>,
        incomingObj as Record<string, unknown>,
        path,
        section
      );
      return;
    }

    const currentRecord = currentObj as Record<string, unknown>;
    const incomingRecord = incomingObj as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(currentRecord), ...Object.keys(incomingRecord)]);

    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      // Determine section from top-level key
      const newSection = path === "" ? key : section;
      compare(currentRecord[key], incomingRecord[key], newPath, newSection);
    }
  }

  /**
   * Compare a flat record whose keys may contain dots (e.g., "homepage.hero").
   * Each entry is compared as an atomic object (JSON comparison).
   */
  function compareFlatRecord(
    currentRecord: Record<string, unknown>,
    incomingRecord: Record<string, unknown>,
    parentPath: string,
    section: string
  ): void {
    const allKeys = new Set([...Object.keys(currentRecord), ...Object.keys(incomingRecord)]);
    for (const key of allKeys) {
      // Use bracket notation in path to preserve dot-keys
      const entryPath = `${parentPath}["${key}"]`;
      const currentVal = currentRecord[key];
      const incomingVal = incomingRecord[key];
      if (JSON.stringify(currentVal) !== JSON.stringify(incomingVal)) {
        diffs.push({
          path: entryPath,
          section,
          field: key,
          currentValue: currentVal,
          newValue: incomingVal,
        });
      }
    }
  }

  compare(current, incoming, "", "");

  return diffs;
}

/**
 * Group diff entries by section for display
 */
export function groupDiffsBySection(diffs: ConfigDiffEntry[]): Record<string, ConfigDiffEntry[]> {
  const grouped: Record<string, ConfigDiffEntry[]> = {};

  for (const diff of diffs) {
    if (!grouped[diff.section]) {
      grouped[diff.section] = [];
    }
    grouped[diff.section].push(diff);
  }

  return grouped;
}

/**
 * Format a value for display in the diff view
 */
export function formatDiffValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value || '""';
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return `[${value.join(", ")}]`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function applySelectedConfigChanges(
  current: StorefrontConfig,
  incoming: StorefrontConfig,
  acceptedPaths: string[]
): StorefrontConfig {
  const next = cloneConfig(current);
  for (const path of acceptedPaths) {
    if (!path) continue;
    const value = getValueAtPath(incoming, path);
    setValueAtPath(next, path, value);
  }
  return next;
}

function cloneConfig(config: StorefrontConfig): StorefrontConfig {
  if (typeof structuredClone === "function") {
    return structuredClone(config) as StorefrontConfig;
  }
  return JSON.parse(JSON.stringify(config)) as StorefrontConfig;
}

/**
 * Parse a path string into segments.
 * Supports dot notation and bracket notation:
 *   "foo.bar.baz" → ["foo", "bar", "baz"]
 *   'foo["bar.baz"].qux' → ["foo", "bar.baz", "qux"]
 */
function parsePath(path: string): string[] {
  const parts: string[] = [];
  let i = 0;
  while (i < path.length) {
    if (path[i] === "[") {
      // Bracket notation: ["key with dots"]
      const quote = path[i + 1]; // " or '
      if (quote === '"' || quote === "'") {
        const end = path.indexOf(`${quote}]`, i + 2);
        if (end === -1) break;
        parts.push(path.slice(i + 2, end));
        i = end + 2; // skip past "]"
        if (path[i] === ".") i++; // skip trailing dot
      } else {
        i++;
      }
    } else {
      // Dot notation: find next dot or bracket
      let end = i;
      while (end < path.length && path[end] !== "." && path[end] !== "[") {
        end++;
      }
      if (end > i) {
        parts.push(path.slice(i, end));
      }
      i = end;
      if (path[i] === ".") i++; // skip dot
    }
  }
  return parts;
}

function getValueAtPath(source: StorefrontConfig, path: string): unknown {
  const parts = parsePath(path);
  let current: unknown = source;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setValueAtPath(target: StorefrontConfig, path: string, value: unknown): void {
  const parts = parsePath(path);
  const lastKey = parts.pop();
  if (!lastKey) return;
  let current: Record<string, unknown> = target as Record<string, unknown>;

  for (const part of parts) {
    const next = current[part];
    if (next && typeof next === "object") {
      current = next as Record<string, unknown>;
    } else {
      current[part] = {};
      current = current[part] as Record<string, unknown>;
    }
  }

  current[lastKey] = value as never;
}

