import {
	ProductListByCollectionDocument,
	ProductsNewestDocument,
	ProductsTopRatedDocument,
	CategoriesForHomepageDocument,
	CollectionsListDocument,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { storeConfig } from "@/config";
import { HomePage } from "./HomePage";
import { homepageCollections, getHeroBannerConfig, getTestimonials, getFeaturedBrands, getBrandLogos } from "@/lib/cms";
import { CartRestoreTrigger } from "./CartRestoreTrigger";
import { ScrollToTopButton } from "./products/ScrollToTopButton";
import { deriveBrandSlug } from "@/components/home/utils";
import type { FeaturedBrand } from "@/lib/cms";

import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "";

export const metadata: Metadata = {
	title: storeConfig.seo.defaultTitle,
	description: storeConfig.seo.defaultDescription,
	alternates: baseUrl
		? {
				languages: {
					"he-IL": `${baseUrl}/ils`,
					"en-US": `${baseUrl}/usd`,
				},
			}
		: undefined,
};

// Organization + WebSite JSON-LD for homepage SEO
const organizationJsonLd = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: storeConfig.store.name,
	url: baseUrl,
	logo: storeConfig.branding?.logo || undefined,
	description: storeConfig.seo.defaultDescription,
	contactPoint: {
		"@type": "ContactPoint",
		email: storeConfig.store.email,
		telephone: storeConfig.store.phone,
		contactType: "customer service",
	},
};

const webSiteJsonLd = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: storeConfig.store.name,
	url: baseUrl,
	potentialAction: {
		"@type": "SearchAction",
		target: `${baseUrl}/{channel}/search?q={search_term_string}`,
		"query-input": "required name=search_term_string",
	},
};

/**
 * Homepage Data Fetching
 *
 * DATA-DRIVEN SECTIONS:
 * - New Arrivals: Uses collection "new-arrivals" if it has products (merchant-curated);
 *   otherwise products sorted by CREATED_AT DESC (newest first).
 * - Best Sellers: Uses collection "best-sellers" if it has products (merchant-curated);
 *   otherwise products sorted by RATING DESC (top-rated). Saleor does not expose "sold count"
 *   in the storefront API, so top-rated is the data-driven fallback.
 *
 * COLLECTION-ONLY SECTIONS:
 * - "featured-products" - Featured (merchant-curated)
 * - "sale" - On Sale (merchant-curated)
 * - "hero-banner", "testimonials", "brands" - CMS metadata
 *
 * CATEGORIES: Top-level categories for "Shop by Category" (CategoriesForHomepageDocument).
 */
/**
 * Fetch ALL brand values directly from the Saleor attribute API.
 * This is more reliable than extracting from limited product queries.
 */
async function fetchBrandAttributeValues(channel: string): Promise<FeaturedBrand[]> {
	try {
		const apiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
		if (!apiUrl) return [];

		const response = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: `
					query BrandAttributeChoices($languageCode: LanguageCodeEnum!) {
						attributes(filter: { slugs: ["brand"] }, first: 1) {
							edges {
								node {
									choices(first: 100) {
										edges {
											node {
												id
												name
												slug
												translation(languageCode: $languageCode) { name }
											}
										}
									}
								}
							}
						}
					}
				`,
				variables: { languageCode: getLanguageCodeForChannel(channel) },
			}),
			next: { revalidate: 300 },
		});

		if (!response.ok) return [];

		const result = await response.json() as { data?: any };
		const choices = result.data?.attributes?.edges?.[0]?.node?.choices?.edges || [];

		const brands: FeaturedBrand[] = [];
		const seen = new Set<string>();

		for (const edge of choices) {
			const value = edge.node;
			const brandName = (value?.translation?.name || value?.name)?.trim();
			if (!brandName) continue;

			const dedupKey = brandName.toLowerCase();
			if (seen.has(dedupKey)) continue;
			seen.add(dedupKey);

			const slug = deriveBrandSlug(brandName);
			brands.push({
				id: value.id || `brand-${slug}`,
				name: brandName,
				logo: "",
				url: `/products?brands=${encodeURIComponent(slug)}`,
			});
		}

		return brands;
	} catch {
		return [];
	}
}

export default async function Page(
	props: { 
		params: Promise<{ channel: string }>;
		searchParams?: Promise<{ restore_cart?: string }>;
	}
) {
	const params = await props.params;
	const { channel } = params;
	
	const newArrivalsLimit = storeConfig.homepage?.sections?.newArrivals?.limit ?? 8;
	const bestSellersLimit = storeConfig.homepage?.sections?.bestSellers?.maxProducts ?? 8;
	const languageCode = getLanguageCodeForChannel(channel);

	// Fetch all data in parallel for better performance
	// Tiered caching strategy:
	// - Product queries: revalidate 0 (always fresh — prices/stock change frequently)
	// - Metadata queries (categories, collections): revalidate 300 (5 min — rarely change)
	// - Brand attributes: revalidate 3600 (1 hr — very stable)
	const [
		featuredData,
		newArrivalsCollectionData,
		bestSellersCollectionData,
		saleData,
		productsNewestData,
		productsTopRatedData,
		categoriesData,
		collectionsData,
		heroBannerConfig,
		testimonialsData,
		brandsData,
		brandLogosMap,
		brandAttributeValues,
	] = await Promise.all([
		executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: homepageCollections.featured, channel, languageCode },
			revalidate: 0,
		}).catch(() => ({ collection: null })),

		executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: homepageCollections.newArrivals, channel, languageCode },
			revalidate: 0,
		}).catch(() => ({ collection: null })),

		executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: homepageCollections.bestSellers, channel, languageCode },
			revalidate: 0,
		}).catch(() => ({ collection: null })),

		executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: homepageCollections.sale, channel, languageCode },
			revalidate: 0,
		}).catch(() => ({ collection: null })),

		// Data-driven: newest products by creation date (New Arrivals fallback)
		executeGraphQL(ProductsNewestDocument, {
			variables: { channel, first: newArrivalsLimit, languageCode },
			revalidate: 0,
		}).catch(() => ({ products: null })),

		// Data-driven: top-rated products (Best Sellers fallback; Saleor has no "sold count" in API)
		executeGraphQL(ProductsTopRatedDocument, {
			variables: { channel, first: bestSellersLimit, languageCode },
			revalidate: 0,
		}).catch(() => ({ products: null })),

		executeGraphQL(CategoriesForHomepageDocument, {
			variables: { channel, first: 8, languageCode },
			revalidate: 300,
		}).catch(() => ({ categories: null })),

		// Collections for CollectionMosaic section
		executeGraphQL(CollectionsListDocument, {
			variables: { channel, first: 20, languageCode },
			revalidate: 300,
		}).catch(() => ({ collections: null })),

		getHeroBannerConfig(channel),
		getTestimonials(channel),
		getFeaturedBrands(channel),
		getBrandLogos(),
		fetchBrandAttributeValues(channel),
	]);

	const newArrivalsFromCollection = newArrivalsCollectionData.collection?.products?.edges?.map(({ node }) => node) ?? [];
	const bestSellersFromCollection = bestSellersCollectionData.collection?.products?.edges?.map(({ node }) => node) ?? [];
	const newestProducts = productsNewestData.products?.edges?.map(({ node }) => node) ?? [];
	const topRatedProducts = productsTopRatedData.products?.edges?.map(({ node }) => node) ?? [];

	const featuredProducts = featuredData.collection?.products?.edges?.map(({ node }) => node) ?? [];
	const newArrivals =
		newArrivalsFromCollection.length > 0
			? newArrivalsFromCollection
			: newestProducts;
	const bestSellers =
		bestSellersFromCollection.length > 0
			? bestSellersFromCollection
			: topRatedProducts;
	const saleProducts = saleData.collection?.products?.edges?.map(({ node }) => node) ?? [];

	// Extract sale collection metadata for PromotionBanner
	const saleCollection = saleData.collection;
	const saleCollectionInfo = saleCollection ? {
		name: saleCollection.name,
		description: saleCollection.description || "",
		backgroundImage: saleCollection.backgroundImage?.url || null,
		promotionName: saleCollection.metadata?.find(
			(m: { key: string }) => m.key.toLowerCase() === "promotion"
		)?.value || "",
		saleEndDate: saleCollection.metadata?.find(
			(m: { key: string }) => m.key.toLowerCase() === "enddate"
		)?.value || null,
	} : null;

	// Transform categories from Dashboard > Catalog > Categories (apply translations)
	const categories = categoriesData.categories?.edges?.map(({ node }) => ({
		id: node.id,
		name: node.translation?.name || node.name,
		slug: node.slug,
		image: node.backgroundImage?.url || undefined,
		productCount: node.products?.totalCount || 0,
		children: node.children?.edges?.map(({ node: child }) => ({
			id: child.id,
			name: child.translation?.name || child.name,
			slug: child.slug,
			productCount: child.products?.totalCount || 0,
			image: child.backgroundImage?.url || undefined,
			imageAlt: child.backgroundImage?.alt || undefined,
		})).filter(child => child.productCount > 0) || [],
	})) || [];

	// Transform collections for CollectionMosaic (apply translations)
	const collections = collectionsData.collections?.edges?.map(({ node }) => ({
		id: node.id,
		name: node.translation?.name || node.name,
		slug: node.slug,
		description: node.translation?.description || node.description,
		backgroundImage: node.backgroundImage,
		products: node.products,
	})) || [];

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
			/>
			{/* Client component to trigger cart restore after OAuth login */}
			{/* This is needed because Server Actions can't modify cookies when called from Server Components */}
			<CartRestoreTrigger channel={channel} />
			<HomePage
				channel={channel}
				categories={categories}
				featuredProducts={featuredProducts}
				newArrivals={newArrivals}
				bestSellers={bestSellers}
				saleProducts={saleProducts}
				saleCollectionInfo={saleCollectionInfo}
				heroBanner={heroBannerConfig}
				testimonials={testimonialsData}
				brands={brandsData.length > 0 ? brandsData : brandAttributeValues}
				brandLogos={Object.fromEntries(brandLogosMap)}
				collections={collections}
			/>
			{/* Floating scroll-to-top (controlled by storefront-control Features > Scroll to Top) */}
			<ScrollToTopButton />
		</>
	);
}
