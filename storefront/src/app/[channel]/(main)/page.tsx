import { ProductListByCollectionDocument, ProductListDocument, CategoriesForHomepageDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { storeConfig } from "@/config";
import { HomePage } from "./HomePage";
import { homepageCollections, getHeroBannerConfig, getTestimonials, getFeaturedBrands } from "@/lib/cms";
import { CartRestoreTrigger } from "./CartRestoreTrigger";

// Dynamic metadata from store config
export const metadata = {
	title: storeConfig.seo.defaultTitle,
	description: storeConfig.seo.defaultDescription,
};

/**
 * Homepage Data Fetching
 * 
 * All data comes from Saleor Dashboard:
 * 
 * COLLECTIONS (Dashboard > Catalog > Collections):
 *   - "featured-products" - Featured products section
 *   - "new-arrivals" - New arrivals section
 *   - "best-sellers" - Best sellers section  
 *   - "sale" - Sale items section
 *   - "hero-banner" - Hero banner config (metadata)
 *   - "testimonials" - Customer testimonials (metadata)
 *   - "brands" - Featured brands (metadata)
 * 
 * CATEGORIES (Dashboard > Catalog > Categories):
 *   - Top-level categories for "Shop by Category" section
 *   - Add background images for visual display
 * 
 * COLLECTION METADATA KEYS:
 *   hero-banner: hero_title, hero_subtitle, hero_cta_text, hero_cta_link, hero_video_url
 *   testimonials: testimonials_json (JSON array)
 *   brands: brands_json (JSON array)
 */
export default async function Page(
	props: { 
		params: Promise<{ channel: string }>;
		searchParams?: Promise<{ restore_cart?: string }>;
	}
) {
	const params = await props.params;
	const { channel } = params;
	
	// Fetch all data in parallel for better performance
	const [
		featuredData,
		newArrivalsData,
		bestSellersData,
		saleData,
		allProductsData,
		categoriesData,
		heroBannerConfig,
		testimonialsData,
		brandsData,
	] = await Promise.all([
		// Collections from Dashboard > Catalog > Collections
		executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: homepageCollections.featured, channel },
			revalidate: 30,
		}).catch(() => ({ collection: null })),
		
		executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: homepageCollections.newArrivals, channel },
			revalidate: 30,
		}).catch(() => ({ collection: null })),
		
		executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: homepageCollections.bestSellers, channel },
			revalidate: 30,
		}).catch(() => ({ collection: null })),
		
		executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: homepageCollections.sale, channel },
			revalidate: 30,
		}).catch(() => ({ collection: null })),
		
		// Fallback products if collections don't exist
		executeGraphQL(ProductListDocument, {
			variables: { first: 16, channel },
			revalidate: 30,
		}).catch(() => ({ products: null })),

		// Categories from Dashboard > Catalog > Categories
		executeGraphQL(CategoriesForHomepageDocument, {
			variables: { channel, first: 8 },
			revalidate: 30,
		}).catch(() => ({ categories: null })),

		// CMS-controlled content from collection metadata
		getHeroBannerConfig(channel),
		getTestimonials(channel),
		getFeaturedBrands(channel),
	]);

	// Extract products from collections (with fallbacks)
	const fallbackProducts = allProductsData.products?.edges?.map(({ node }) => node) || [];
	
	const featuredProducts = featuredData.collection?.products?.edges?.map(({ node }) => node) || [];
	const newArrivals = newArrivalsData.collection?.products?.edges?.map(({ node }) => node) || 
		fallbackProducts.slice(0, storeConfig.homepage.sections.newArrivals.limit);
	const bestSellers = bestSellersData.collection?.products?.edges?.map(({ node }) => node) ||
		fallbackProducts.slice(0, storeConfig.homepage.sections.bestSellers.limit);
	const saleProducts = saleData.collection?.products?.edges?.map(({ node }) => node) || [];

	// Transform categories from Dashboard > Catalog > Categories
	const categories = categoriesData.categories?.edges?.map(({ node }) => ({
		id: node.id,
		name: node.name,
		slug: node.slug,
		image: node.backgroundImage?.url || undefined,
		productCount: node.products?.totalCount || 0,
	})) || [];

	return (
		<>
			{/* Client component to trigger cart restore after OAuth login */}
			{/* This is needed because Server Actions can't modify cookies when called from Server Components */}
			<CartRestoreTrigger channel={channel} />
			<HomePage
				categories={categories}
				featuredProducts={featuredProducts}
				newArrivals={newArrivals}
				bestSellers={bestSellers}
				saleProducts={saleProducts}
				heroBanner={heroBannerConfig}
				testimonials={testimonialsData}
				brands={brandsData}
			/>
		</>
	);
}
