/**
 * Search query enhancer — the brain of the smart search system.
 *
 * Takes a raw user query and produces an enhanced version with:
 * - Typo corrections (via fuzzy matching against catalog vocabulary)
 * - Stemming (beds → bed, puppies → puppy)
 * - Category/collection detection (query "dogs" → categorySlug: "dogs")
 * - "Did you mean?" suggestions (when correction differs from input)
 *
 * Fully dynamic: vocabulary comes from the actual Saleor catalog,
 * so the enhancer adapts automatically when products change.
 */

import { findBestMatch, simpleStem, tokenize } from "./fuzzy";
import { getCatalogVocabulary, type CatalogVocabulary } from "./catalog-vocabulary";

/** Wrapper to prevent TS 5.5+ Set.has() type-narrowing from collapsing token to `never` */
function vocabHas(vocab: CatalogVocabulary, word: string): boolean {
  return vocab.wordSet.has(word);
}

export interface EnhancedQuery {
  /** Original user input */
  original: string;
  /** Corrected/enhanced query to send to Saleor */
  corrected: string;
  /** "Did you mean X?" suggestion (only set when different from original) */
  didYouMean?: string;
  /** Additional query variations to try if main returns few results */
  alternatives: string[];
  /** Detected category context (slug) */
  categorySlug?: string;
  /** Detected collection context (slug) */
  collectionSlug?: string;
}

/**
 * Enhance a search query using the catalog vocabulary.
 * This is the main entry point — call this before sending queries to Saleor.
 */
export async function enhanceSearchQuery(
  query: string,
  channel: string,
  languageCode: string,
): Promise<EnhancedQuery> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return { original: trimmed, corrected: trimmed, alternatives: [] };
  }

  const vocabulary = await getCatalogVocabulary(channel, languageCode);

  // If vocabulary is empty (fetch failed), pass through unchanged
  if (vocabulary.words.length === 0) {
    return { original: trimmed, corrected: trimmed, alternatives: [] };
  }

  // 1. Try full-phrase match first (e.g., "dog beds" matches category "Dog Beds")
  const phraseResult = matchPhrase(trimmed, vocabulary);
  if (phraseResult) return phraseResult;

  // 2. Token-level correction — fix individual words
  return matchTokens(trimmed, vocabulary);
}

// ---------------------------------------------------------------------------
// Strategy 1: Full-phrase matching
// ---------------------------------------------------------------------------

function matchPhrase(query: string, vocab: CatalogVocabulary): EnhancedQuery | null {
  const match = findBestMatch(query, vocab.phrases, 0.65);
  if (!match) return null;

  // Even for exact matches, detect category/collection context so the
  // fallback search can use them when text search returns no results.
  const categorySlug = vocab.categories.get(match.match.toLowerCase());
  const collectionSlug = vocab.collections.get(match.match.toLowerCase());

  if (match.score >= 1) {
    // Exact match — no correction needed, but still return category/collection context
    if (!categorySlug && !collectionSlug) return null;
    return {
      original: query,
      corrected: query,
      alternatives: [],
      categorySlug,
      collectionSlug,
    };
  }

  // Close match found — this is likely what the user meant
  const result: EnhancedQuery = {
    original: query,
    corrected: match.match,
    alternatives: [query], // also try original as fallback
    categorySlug,
    collectionSlug,
  };

  // Only show "did you mean?" if the correction is meaningfully different
  if (match.match.toLowerCase() !== query.toLowerCase()) {
    result.didYouMean = match.match;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Strategy 2: Token-level correction
// ---------------------------------------------------------------------------

function matchTokens(query: string, vocab: CatalogVocabulary): EnhancedQuery {
  const tokens: string[] = tokenize(query);
  if (tokens.length === 0) {
    return { original: query, corrected: query, alternatives: [] };
  }

  const correctedTokens: string[] = [];
  let hasCorrection = false;
  let categorySlug: string | undefined;
  let collectionSlug: string | undefined;

  for (const token of tokens) {
    if (vocabHas(vocab, token)) {
      // a) Already in vocabulary → keep as-is
      correctedTokens.push(vocab.canonicalMap.get(token) ?? token);
      categorySlug = categorySlug || vocab.categories.get(token);
      collectionSlug = collectionSlug || vocab.collections.get(token);
    } else {
      const stemmed = simpleStem(token);
      if (stemmed !== token && vocabHas(vocab, stemmed)) {
        // b) Stemmed form is in vocabulary → use stem
        correctedTokens.push(vocab.canonicalMap.get(stemmed) ?? stemmed);
        hasCorrection = true;
        categorySlug = categorySlug || vocab.categories.get(stemmed);
        collectionSlug = collectionSlug || vocab.collections.get(stemmed);
      } else {
        // c) Fuzzy match against vocabulary words
        //    Adaptive threshold: shorter words need higher similarity
        const threshold = token.length <= 4 ? 0.7 : 0.6;
        const match = findBestMatch(token, vocab.words, threshold);
        if (match && match.score < 1) {
          const canonical = vocab.canonicalMap.get(match.match) ?? match.match;
          correctedTokens.push(canonical);
          hasCorrection = true;
          categorySlug = categorySlug || vocab.categories.get(match.match);
          collectionSlug = collectionSlug || vocab.collections.get(match.match);
        } else {
          // d) No match found — keep original token
          correctedTokens.push(token);
        }
      }
    }
  }

  const corrected = correctedTokens.join(" ");
  const result: EnhancedQuery = {
    original: query,
    corrected: hasCorrection ? corrected : query,
    alternatives: [],
    categorySlug,
    collectionSlug,
  };

  // Show "did you mean?" only if correction is meaningfully different
  if (hasCorrection && corrected.toLowerCase() !== query.toLowerCase()) {
    result.didYouMean = corrected;
    result.alternatives.push(query); // keep original as fallback
  }

  // Generate stem-based alternative for broader matching
  const stemmedQuery = tokens.map(simpleStem).join(" ");
  if (
    stemmedQuery !== query.toLowerCase() &&
    stemmedQuery !== corrected.toLowerCase()
  ) {
    result.alternatives.push(stemmedQuery);
  }

  return result;
}
