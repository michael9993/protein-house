/**
 * Slim defaults file.
 *
 * Most defaults are now embedded in the Zod schemas via z.default().
 * This file only contains:
 * 1. Constants that are referenced by name elsewhere
 * 2. Language-specific text defaults that can't be embedded in schema
 *    (because they differ per locale: Hebrew vs English)
 */

export { DEFAULT_SECTION_ORDER, DEFAULT_RTL_LOCALES } from "./schema";

/**
 * Config version. Increment when making breaking schema changes.
 */
export const CONFIG_VERSION = 1;
