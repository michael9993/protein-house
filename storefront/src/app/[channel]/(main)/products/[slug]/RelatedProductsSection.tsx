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
  /** Section title */
  title?: string;
  /** Section subtitle */
  subtitle?: string | null;
}

/**
 * Server component for fetching and displaying related products.
 * Uses category-based strategy by default.
 * Wrapped in Suspense boundary in parent for non-blocking render.
 */
export async function RelatedProductsSection({
  categorySlug,
  currentProductId,
  channel,
  maxItems = 8,
  title = "You May Also Like",
  subtitle = "Customers also viewed these products",
}: RelatedProductsSectionProps) {
  // Fetch products from the same category
  const { category } = await executeGraphQL(ProductListByCategoryDocument, {
    variables: {
      slug: categorySlug,
      channel,
    },
    revalidate: 60, // Match product cache duration
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
    <section className="mt-4 border-t border-neutral-200 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-base text-neutral-600">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel */}
        <RelatedProductsCarousel 
          products={relatedProducts} 
          channel={channel}
        />
      </div>
    </section>
  );
}
