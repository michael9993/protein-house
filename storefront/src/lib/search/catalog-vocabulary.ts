/**
 * Dynamic catalog vocabulary — builds a searchable term index
 * from the actual Saleor catalog data. The vocabulary automatically
 * adapts when the product base changes (cached with 5-minute TTL).
 *
 * This is the foundation that makes search dynamic: when you switch
 * from a pet store to a shoe store, the vocabulary rebuilds from
 * the new catalog and all fuzzy matching/corrections adapt accordingly.
 */

import { tokenize } from "./fuzzy";

export interface CatalogVocabulary {
  /** All multi-word terms (category names, collection names, product names) */
  phrases: string[];
  /** All individual words extracted from the catalog */
  words: string[];
  /** Category name (lowercase) → slug */
  categories: Map<string, string>;
  /** Collection name (lowercase) → slug */
  collections: Map<string, string>;
  /** Lowercase word → canonical (original-case) form */
  canonicalMap: Map<string, string>;
  /** Set of all known lowercase words for quick lookup */
  wordSet: Set<string>;
}

// ---------------------------------------------------------------------------
// GraphQL vocabulary query — fetches categories, collections, and product
// names from Saleor. Uses Next.js fetch caching (revalidate: 300s).
// ---------------------------------------------------------------------------

const VOCABULARY_QUERY = `
  query CatalogVocabulary($channel: String!, $languageCode: LanguageCodeEnum!) {
    categories(first: 100) {
      edges {
        node {
          name
          slug
          translation(languageCode: $languageCode) { name }
          children(first: 50) {
            edges {
              node {
                name
                slug
                translation(languageCode: $languageCode) { name }
              }
            }
          }
        }
      }
    }
    collections(first: 100, channel: $channel) {
      edges {
        node {
          name
          slug
          translation(languageCode: $languageCode) { name }
        }
      }
    }
    products(first: 200, channel: $channel, sortBy: { field: NAME, direction: ASC }) {
      edges {
        node {
          name
          translation(languageCode: $languageCode) { name }
          attributes {
            attribute { name slug }
            values { name translation(languageCode: $languageCode) { name } }
          }
        }
      }
    }
  }
`;

// Saleor API URL — server-side uses Docker internal, client falls back to public
const getSaleorApiUrl = () =>
  process.env.SALEOR_API_URL ||
  process.env.NEXT_PUBLIC_SALEOR_API_URL ||
  "http://saleor-api:8000/graphql/";

// ---------------------------------------------------------------------------
// Types for the raw GraphQL response
// ---------------------------------------------------------------------------

interface CategoryNode {
  name: string;
  slug: string;
  translation?: { name?: string } | null;
  children?: { edges: Array<{ node: CategoryNode }> };
}

interface CollectionNode {
  name: string;
  slug: string;
  translation?: { name?: string } | null;
}

interface ProductNode {
  name: string;
  translation?: { name?: string } | null;
  attributes?: Array<{
    attribute: { name: string; slug: string };
    values: Array<{ name: string; translation?: { name?: string } | null }>;
  }>;
}

interface VocabularyData {
  categories?: { edges: Array<{ node: CategoryNode }> };
  collections?: { edges: Array<{ node: CollectionNode }> };
  products?: { edges: Array<{ node: ProductNode }> };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch and build the catalog vocabulary for a given channel/language.
 * Results are cached by Next.js fetch for 5 minutes.
 */
export async function getCatalogVocabulary(
  channel: string,
  languageCode: string,
): Promise<CatalogVocabulary> {
  try {
    const res = await fetch(getSaleorApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: VOCABULARY_QUERY,
        variables: { channel, languageCode },
      }),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`[search] Vocabulary fetch failed: ${res.status}`);
      return emptyVocabulary();
    }

    const json = (await res.json()) as { data?: VocabularyData };
    return buildVocabulary(json.data);
  } catch (error) {
    console.error("[search] Failed to build catalog vocabulary:", error);
    return emptyVocabulary();
  }
}

// ---------------------------------------------------------------------------
// Vocabulary builder
// ---------------------------------------------------------------------------

function buildVocabulary(data: VocabularyData | undefined): CatalogVocabulary {
  const phrases: string[] = [];
  const categories = new Map<string, string>();
  const collections = new Map<string, string>();
  const canonicalMap = new Map<string, string>();
  const wordSet = new Set<string>();

  if (!data) return emptyVocabulary();

  // -- Categories (including children) --
  for (const edge of data.categories?.edges ?? []) {
    processCategory(edge.node, phrases, categories, wordSet, canonicalMap);
    for (const childEdge of edge.node.children?.edges ?? []) {
      processCategory(childEdge.node, phrases, categories, wordSet, canonicalMap);
    }
  }

  // -- Collections --
  for (const edge of data.collections?.edges ?? []) {
    const { name, slug, translation } = edge.node;
    const translated = translation?.name || name;
    addPhrase(name, phrases, wordSet, canonicalMap);
    if (translated !== name) addPhrase(translated, phrases, wordSet, canonicalMap);
    collections.set(name.toLowerCase(), slug);
    collections.set(translated.toLowerCase(), slug);
  }

  // -- Products (names + attribute values) --
  for (const edge of data.products?.edges ?? []) {
    const { name, translation, attributes } = edge.node;
    const translated = translation?.name || name;
    addPhrase(name, phrases, wordSet, canonicalMap);
    if (translated !== name) addPhrase(translated, phrases, wordSet, canonicalMap);

    // Extract attribute values (colors, sizes, materials, brands, etc.)
    for (const attr of attributes ?? []) {
      for (const val of attr.values) {
        const valName = val.translation?.name || val.name;
        addWord(valName, wordSet, canonicalMap);
        if (val.name !== valName) addWord(val.name, wordSet, canonicalMap);
      }
    }
  }

  // Deduplicate phrases
  const uniquePhrases = [...new Set(phrases)];

  return {
    phrases: uniquePhrases,
    words: Array.from(wordSet),
    categories,
    collections,
    canonicalMap,
    wordSet,
  };
}

function processCategory(
  node: CategoryNode,
  phrases: string[],
  categories: Map<string, string>,
  wordSet: Set<string>,
  canonicalMap: Map<string, string>,
) {
  const { name, slug, translation } = node;
  const translated = translation?.name || name;
  addPhrase(name, phrases, wordSet, canonicalMap);
  if (translated !== name) addPhrase(translated, phrases, wordSet, canonicalMap);
  categories.set(name.toLowerCase(), slug);
  categories.set(translated.toLowerCase(), slug);
}

function addPhrase(
  phrase: string,
  phrases: string[],
  wordSet: Set<string>,
  canonicalMap: Map<string, string>,
) {
  phrases.push(phrase);
  canonicalMap.set(phrase.toLowerCase(), phrase);
  // Split into individual words
  for (const word of tokenize(phrase)) {
    wordSet.add(word);
    if (!canonicalMap.has(word)) {
      canonicalMap.set(word, word);
    }
  }
}

function addWord(
  word: string,
  wordSet: Set<string>,
  canonicalMap: Map<string, string>,
) {
  const lower = word.toLowerCase().trim();
  if (lower.length >= 2) {
    wordSet.add(lower);
    if (!canonicalMap.has(lower)) {
      canonicalMap.set(lower, word);
    }
  }
}

function emptyVocabulary(): CatalogVocabulary {
  return {
    phrases: [],
    words: [],
    categories: new Map(),
    collections: new Map(),
    canonicalMap: new Map(),
    wordSet: new Set(),
  };
}
