import { NextRequest, NextResponse } from "next/server";
import { executeGraphQL } from "@/lib/graphql";
import { SearchProductsDocument } from "@/gql/graphql";
import { ProductOrderField, OrderDirection } from "@/gql/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { getClientIp, rateLimitResponse, normalLimiter } from "@/lib/rate-limit";
import { enhanceSearchQuery } from "@/lib/search/query-enhancer";

export async function GET(request: NextRequest) {
  const { allowed, resetAt } = normalLimiter(getClientIp(request));
  if (!allowed) return rateLimitResponse(resetAt);

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const channel = searchParams.get("channel");
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    if (!query || !channel || query.length < 2) {
      return NextResponse.json({ products: [], didYouMean: null });
    }

    const languageCode = getLanguageCodeForChannel(channel);

    // Enhance the query with fuzzy matching and typo correction
    const enhanced = await enhanceSearchQuery(query, channel, languageCode);

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

    let productList = (products?.edges || []).map((edge) => ({
      id: edge.node.id,
      name: edge.node.translation?.name || edge.node.name,
      slug: edge.node.slug,
      thumbnail: edge.node.thumbnail,
      pricing: edge.node.pricing,
    }));

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
      productList = (fallback.products?.edges || []).map((edge) => ({
        id: edge.node.id,
        name: edge.node.translation?.name || edge.node.name,
        slug: edge.node.slug,
        thumbnail: edge.node.thumbnail,
        pricing: edge.node.pricing,
      }));
    }

    // If still no results and there are alternatives, try those
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
        const altProducts = (altResult.products?.edges || []).map((edge) => ({
          id: edge.node.id,
          name: edge.node.translation?.name || edge.node.name,
          slug: edge.node.slug,
          thumbnail: edge.node.thumbnail,
          pricing: edge.node.pricing,
        }));
        if (altProducts.length > 0) {
          productList = altProducts;
          break;
        }
      }
    }

    return NextResponse.json({
      products: productList,
      didYouMean: enhanced.didYouMean ?? null,
      correctedQuery: enhanced.corrected !== query ? enhanced.corrected : null,
    });
  } catch (error) {
    console.error("Search suggestions API error:", error);
    return NextResponse.json({ products: [], didYouMean: null }, { status: 500 });
  }
}
