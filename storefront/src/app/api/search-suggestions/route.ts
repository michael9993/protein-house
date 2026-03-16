import { NextRequest, NextResponse } from "next/server";
import { executeGraphQL } from "@/lib/graphql";
import { SearchProductsDocument, ProductListFilteredDocument } from "@/gql/graphql";
import { ProductOrderField, OrderDirection } from "@/gql/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { getClientIp, rateLimitResponse, normalLimiter } from "@/lib/rate-limit";
import { enhanceSearchQuery } from "@/lib/search/query-enhancer";
import { getCatalogVocabulary } from "@/lib/search/catalog-vocabulary";
import { findAllMatches } from "@/lib/search/fuzzy";

export async function GET(request: NextRequest) {
  const { allowed, resetAt } = normalLimiter(getClientIp(request));
  if (!allowed) return rateLimitResponse(resetAt);

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const channel = searchParams.get("channel");
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    if (!query || !channel || query.length < 2) {
      return NextResponse.json({ products: [], categories: [], collections: [], didYouMean: null });
    }

    const languageCode = getLanguageCodeForChannel(channel);

    // Run vocabulary fetch + search enhancement in parallel
    const [enhanced, vocabulary] = await Promise.all([
      enhanceSearchQuery(query, channel, languageCode),
      getCatalogVocabulary(channel, languageCode),
    ]);

    // Find matching categories and collections from the vocabulary
    const categoryMatches = findMatchingEntries(query, vocabulary.categories, 3);
    const collectionMatches = findMatchingEntries(query, vocabulary.collections, 3);

    // Search with the corrected query
    const { products } = await executeGraphQL(SearchProductsDocument, {
      variables: {
        search: enhanced.corrected,
        channel,
        languageCode,
        sortBy: ProductOrderField.Rating,
        sortDirection: OrderDirection.Asc,
        first: limit,
      },
      revalidate: 60,
    });

    let productList = mapProducts(products);

    // If corrected query returned no results, try the original
    if (productList.length === 0 && enhanced.corrected !== query) {
      const fallback = await executeGraphQL(SearchProductsDocument, {
        variables: {
          search: query,
          channel,
          languageCode,
          sortBy: ProductOrderField.Rating,
          sortDirection: OrderDirection.Asc,
          first: limit,
        },
        revalidate: 60,
      });
      productList = mapProducts(fallback.products);
    }

    // If still no results, try alternatives
    if (productList.length === 0) {
      for (const alt of enhanced.alternatives) {
        if (alt === query || alt === enhanced.corrected) continue;
        const altResult = await executeGraphQL(SearchProductsDocument, {
          variables: {
            search: alt,
            channel,
            languageCode,
            sortBy: ProductOrderField.Rating,
            sortDirection: OrderDirection.Asc,
            first: limit,
          },
          revalidate: 60,
        });
        const altProducts = mapProducts(altResult.products);
        if (altProducts.length > 0) {
          productList = altProducts;
          break;
        }
      }
    }

    // Smart fallback: if text search found nothing but we matched a category,
    // fetch products from that category instead
    if (productList.length === 0 && (enhanced.categorySlug || categoryMatches.length > 0)) {
      const catSlug = enhanced.categorySlug || categoryMatches[0]?.slug;
      if (catSlug) {
        const catId = await resolveCategoryId(catSlug, channel);
        if (catId) {
          const catResult = await executeGraphQL(ProductListFilteredDocument, {
            variables: {
              first: limit,
              channel,
              languageCode,
              sortBy: { field: ProductOrderField.Rating, direction: OrderDirection.Asc },
              filter: { categories: [catId] },
            },
            revalidate: 60,
          });
          productList = mapProducts(catResult.products);
        }
      }
    }

    return NextResponse.json({
      products: productList,
      categories: categoryMatches,
      collections: collectionMatches,
      didYouMean: enhanced.didYouMean ?? null,
      correctedQuery: enhanced.corrected !== query ? enhanced.corrected : null,
    });
  } catch (error) {
    console.error("Search suggestions API error:", error);
    return NextResponse.json({ products: [], categories: [], collections: [], didYouMean: null }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapProducts(products: any) {
  return (products?.edges || []).map((edge: any) => ({
    id: edge.node.id,
    name: edge.node.translation?.name || edge.node.name,
    slug: edge.node.slug,
    thumbnail: edge.node.thumbnail,
    pricing: edge.node.pricing,
  }));
}

/**
 * Find matching categories/collections using fuzzy + prefix + substring matching.
 * Returns entries sorted by match quality.
 */
function findMatchingEntries(
  query: string,
  nameToSlugMap: Map<string, string>,
  maxResults: number,
): Array<{ name: string; slug: string; score: number }> {
  const names = Array.from(nameToSlugMap.keys());
  if (names.length === 0) return [];

  const q = query.toLowerCase();
  const results: Array<{ name: string; slug: string; score: number }> = [];
  const seenSlugs = new Set<string>();

  for (const name of names) {
    const slug = nameToSlugMap.get(name)!;
    if (seenSlugs.has(slug)) continue;

    const n = name.toLowerCase();
    let score = 0;

    if (n === q) {
      score = 1.0; // exact match
    } else if (n.startsWith(q)) {
      score = 0.95; // prefix match ("pet" → "pet nests")
    } else {
      // Check if any word in the name starts with a query word (word-boundary aware)
      const words = n.split(/[\s,&\-]+/).filter(Boolean);
      const qWords = q.split(/[\s,&\-]+/).filter(Boolean);
      const wordMatches = qWords.filter((qw) =>
        words.some((w) => w.startsWith(qw) && qw.length >= 3)
      );
      if (wordMatches.length > 0 && wordMatches.length === qWords.length) {
        // All query words match a word prefix → strong match
        score = 0.85;
      } else if (wordMatches.length > 0) {
        // Some query words match → partial match
        score = 0.65 * (wordMatches.length / qWords.length);
      } else {
        // Fuzzy match on whole phrase (only for queries >= 4 chars to avoid noise)
        if (q.length >= 4) {
          const fuzzyMatches = findAllMatches(q, [name], 0.6, 1);
          if (fuzzyMatches.length > 0) {
            score = fuzzyMatches[0].score * 0.6; // discount fuzzy matches
          }
        }
      }
    }

    if (score >= 0.4) {
      seenSlugs.add(slug);
      // Recover the canonical (original-case) name
      const canonicalName = Array.from(nameToSlugMap.entries())
        .find(([, s]) => s === slug)?.[0] || name;
      results.push({ name: canonicalName, slug, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Resolve a category slug to its Saleor ID.
 */
async function resolveCategoryId(slug: string, channel: string): Promise<string | null> {
  try {
    const apiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL || "http://saleor-api:8000/graphql/";
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query CategoryBySlug($slug: String!, $channel: String!) {
          categories(filter: { slugs: [$slug] }, first: 1) {
            edges { node { id } }
          }
        }`,
        variables: { slug, channel },
      }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { categories?: { edges?: Array<{ node: { id: string } }> } } };
    return data.data?.categories?.edges?.[0]?.node?.id ?? null;
  } catch {
    return null;
  }
}
