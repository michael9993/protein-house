import type { SearchEntry } from "./types";
import { generateSearchIndex } from "./generate-index";

export type { SearchEntry } from "./types";

let cachedIndex: SearchEntry[] | null = null;

/**
 * Returns the comprehensive search index.
 * Computed lazily on first call, then cached in memory.
 */
export function getSearchIndex(): SearchEntry[] {
  if (!cachedIndex) {
    cachedIndex = generateSearchIndex();
  }
  return cachedIndex;
}
