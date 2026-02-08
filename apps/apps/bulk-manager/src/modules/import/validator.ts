import { z } from "zod";

export interface RowValidationResult {
  row: number;
  valid: boolean;
  errors: { field: string; message: string }[];
  data: Record<string, string>;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  results: RowValidationResult[];
}

/**
 * Validate an array of parsed rows against a Zod schema.
 * Applies field mappings before validation.
 */
export function validateRows(
  rows: Record<string, string>[],
  schema: z.ZodSchema,
  fieldMappings: Record<string, string>
): ValidationSummary {
  const results: RowValidationResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Apply field mappings
    const mapped: Record<string, string> = {};
    for (const [sourceField, targetField] of Object.entries(fieldMappings)) {
      if (targetField && row[sourceField] !== undefined) {
        mapped[targetField] = row[sourceField];
      }
    }

    const parseResult = schema.safeParse(mapped);

    if (parseResult.success) {
      results.push({
        row: i + 1,
        valid: true,
        errors: [],
        data: mapped,
      });
    } else {
      const errors = parseResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      results.push({
        row: i + 1,
        valid: false,
        errors,
        data: mapped,
      });
    }
  }

  return {
    totalRows: rows.length,
    validRows: results.filter((r) => r.valid).length,
    invalidRows: results.filter((r) => !r.valid).length,
    results,
  };
}
