import { NextRequest, NextResponse } from "next/server";
import { executeGraphQL } from "@/lib/graphql";
import { SearchProductsDocument } from "@/gql/graphql";
import { ProductOrderField, OrderDirection } from "@/gql/graphql";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const channel = searchParams.get("channel");
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    if (!query || !channel || query.length < 2) {
      return NextResponse.json({ products: [] });
    }

    const { products } = await executeGraphQL(SearchProductsDocument, {
      variables: {
        search: query,
        channel,
        sortBy: ProductOrderField.Rating,
        sortDirection: OrderDirection.Asc,
        first: limit,
      },
      revalidate: 60,
    });

    const productList = (products?.edges || []).map((edge) => ({
      id: edge.node.id,
      name: edge.node.name,
      slug: edge.node.slug,
      thumbnail: edge.node.thumbnail,
      pricing: edge.node.pricing,
    }));

    return NextResponse.json({ products: productList });
  } catch (error) {
    console.error("Search suggestions API error:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
