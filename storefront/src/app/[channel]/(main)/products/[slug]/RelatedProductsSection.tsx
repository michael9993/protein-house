import { ProductListByCategoryDocument, ProductListItemFragment } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { RelatedProductsCarousel } from "@/ui/components/RelatedProducts/RelatedProductsCarousel";

interface RelatedProductsSectionProps {
  /** Category slug for fetching related products */
  categorySlug: string;
  /** Current product ID to exclude from results */
  currentProductId: string;
  /** Current channel */
  channel: string;
  /** Maximum items to display (from config) */
  maxItems?: number;
}

/**
 * Server component for fetching related products.
 * Title/subtitle/styling come from storefront control config in the carousel client component.
 * Wrapped in Suspense boundary in parent for non-blocking render.
 */
export async function RelatedProductsSection({
  categorySlug,
  currentProductId,
  channel,
  maxItems = 8,
}: RelatedProductsSectionProps) {
  // Fetch products from the same category
  const { category } = await executeGraphQL(ProductListByCategoryDocument, {
    variables: {
      slug: categorySlug,
      channel,
    },
    revalidate: 60,
  });

  if (!category?.products?.edges) {
    return null;
  }

  // Filter out current product and limit to maxItems
  const relatedProducts = category.products.edges
    .map((edge) => edge.node)
    .filter((product): product is ProductListItemFragment =>
      product !== null && product.id !== currentProductId
    )
    .slice(0, maxItems);

  // Don't render if we have fewer than 2 related products
  if (relatedProducts.length < 2) {
    return null;
  }

  return (
    <RelatedProductsCarousel
      products={relatedProducts}
      channel={channel}
    />
  );
}
