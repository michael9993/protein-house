import { TRPCError } from "@trpc/server";

/**
 * Shape of a urql GraphQL error result.
 */
interface GraphQLErrorResult {
  graphQLErrors?: Array<{ message: string }>;
  networkError?: { message: string };
  message?: string;
}

/**
 * Extract a human-readable error message from a urql GraphQL error result.
 */
export function extractGraphQLError(error: GraphQLErrorResult, fallback = "GraphQL error"): string {
  return error.graphQLErrors?.map((e) => e.message).join("; ")
    || error.networkError?.message
    || error.message
    || fallback;
}

/**
 * Check urql query result for errors and throw a descriptive TRPCError if found.
 */
export function assertQuerySuccess(result: { data?: unknown; error?: GraphQLErrorResult }, operationName: string) {
  if (result.error) {
    const errorMsg = extractGraphQLError(result.error, "Unknown GraphQL error");
    console.error(`[${operationName}] GraphQL error:`, errorMsg);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `GraphQL query failed (${operationName}): ${errorMsg}`,
    });
  }
}

/**
 * Apply field mappings to transform uploaded column names to Saleor field names
 */
export function applyFieldMappings(row: Record<string, string>, mappings: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [uploadedField, saleorField] of Object.entries(mappings)) {
    if (saleorField && row[uploadedField] !== undefined) {
      mapped[saleorField] = row[uploadedField];
    }
  }
  return mapped;
}

/**
 * Try to parse Saleor's EditorJS JSON description to plain text
 */
export function tryParseDescription(description: string): string {
  try {
    const parsed = JSON.parse(description);
    if (parsed.blocks) {
      return parsed.blocks.map((b: { data?: { text?: string } }) => b.data?.text || "").join("\n");
    }
    return description;
  } catch {
    return description;
  }
}

/**
 * Parse a boolean-like string value
 */
export function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const lower = value.toLowerCase().trim();
  if (["true", "1", "yes"].includes(lower)) return true;
  if (["false", "0", "no"].includes(lower)) return false;
  return defaultValue;
}

/**
 * Parse semicolon-separated metadata string into key-value pairs
 * Format: "key1:value1;key2:value2"
 */
export function parseMetadata(value: string | undefined): { key: string; value: string }[] {
  if (!value) return [];
  return value
    .split(";")
    .map((pair) => pair.trim())
    .filter((pair) => pair.includes(":"))
    .map((pair) => {
      const idx = pair.indexOf(":");
      return { key: pair.substring(0, idx).trim(), value: pair.substring(idx + 1).trim() };
    });
}

/**
 * Parse a semicolon-separated list into an array
 */
export function parseSemicolonList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(value: string): boolean {
  try { new URL(value); return true; } catch { return false; }
}

/**
 * Parse an integer string, returning undefined if invalid or NaN.
 * Optionally enforces a minimum value (e.g., 0 for stock quantities).
 */
export function safeParseInt(value: string | undefined, min?: number): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  if (isNaN(n)) return undefined;
  if (min !== undefined && n < min) return undefined;
  return n;
}

/**
 * Parse a float string, returning undefined if invalid or NaN.
 */
export function safeParseFloat(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseFloat(value);
  if (isNaN(n)) return undefined;
  return n;
}

/**
 * Standard import result type
 */
export type ImportResult = { row: number; success: boolean; error?: string; id?: string; warning?: string };

/**
 * Standard import response
 */
export function buildImportResponse(results: ImportResult[], totalRows: number) {
  return {
    total: totalRows,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}
