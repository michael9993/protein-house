import type { MetadataRoute } from "next";
import { executeGraphQL } from "@/lib/graphql";

const BASE_URL =
	process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000";
const DEFAULT_CHANNEL =
	process.env.NEXT_PUBLIC_DEFAULT_CHANNEL || "default-channel";

// Channel → locale mapping for hreflang alternates
const CHANNEL_CONFIG: Record<string, { locale: string; label: string }> = {
	"default-channel": { locale: "he", label: "Hebrew" },
	ils: { locale: "he", label: "Hebrew" },
	usd: { locale: "en", label: "English" },
};

// All channels to include in sitemap (both languages)
const ALL_CHANNELS = [DEFAULT_CHANNEL, "usd"];

// Inline queries to avoid codegen dependency
const ProductSlugsQuery = {
	toString: () => `query ProductSlugs($channel: String!, $first: Int!, $after: String) {
		products(channel: $channel, first: $first, after: $after) {
			edges {
				node {
					slug
					updatedAt
				}
			}
			pageInfo {
				hasNextPage
				endCursor
			}
		}
	}`,
} as any;

const CategorySlugsQuery = {
	toString: () => `query CategorySlugs($first: Int!, $after: String) {
		categories(first: $first, after: $after) {
			edges {
				node {
					slug
					updatedAt
				}
			}
			pageInfo {
				hasNextPage
				endCursor
			}
		}
	}`,
} as any;

const CollectionSlugsQuery = {
	toString: () => `query CollectionSlugs($channel: String!, $first: Int!, $after: String) {
		collections(channel: $channel, first: $first, after: $after) {
			edges {
				node {
					slug
				}
			}
			pageInfo {
				hasNextPage
				endCursor
			}
		}
	}`,
} as any;

async function fetchAllProductSlugs(channel: string) {
	const slugs: { slug: string; updatedAt?: string }[] = [];
	let after: string | null = null;

	for (let i = 0; i < 50; i++) {
		// Safety limit: 50 pages * 100 = 5,000 products
		try {
			const result: any = await executeGraphQL(ProductSlugsQuery, {
				variables: { channel, first: 100, after },
				revalidate: 3600, // Cache for 1 hour
			});
			const edges = result?.products?.edges ?? [];
			for (const edge of edges) {
				slugs.push({
					slug: edge.node.slug,
					updatedAt: edge.node.updatedAt,
				});
			}
			if (!result?.products?.pageInfo?.hasNextPage) break;
			after = result.products.pageInfo.endCursor;
		} catch {
			break;
		}
	}
	return slugs;
}

async function fetchAllCategorySlugs() {
	const slugs: { slug: string; updatedAt?: string }[] = [];
	let after: string | null = null;

	for (let i = 0; i < 10; i++) {
		try {
			const result: any = await executeGraphQL(CategorySlugsQuery, {
				variables: { first: 100, after },
				revalidate: 3600,
			});
			const edges = result?.categories?.edges ?? [];
			for (const edge of edges) {
				slugs.push({
					slug: edge.node.slug,
					updatedAt: edge.node.updatedAt,
				});
			}
			if (!result?.categories?.pageInfo?.hasNextPage) break;
			after = result.categories.pageInfo.endCursor;
		} catch {
			break;
		}
	}
	return slugs;
}

async function fetchAllCollectionSlugs(channel: string) {
	const slugs: string[] = [];
	let after: string | null = null;

	for (let i = 0; i < 10; i++) {
		try {
			const result: any = await executeGraphQL(CollectionSlugsQuery, {
				variables: { channel, first: 100, after },
				revalidate: 3600,
			});
			const edges = result?.collections?.edges ?? [];
			for (const edge of edges) {
				slugs.push(edge.node.slug);
			}
			if (!result?.collections?.pageInfo?.hasNextPage) break;
			after = result.collections.pageInfo.endCursor;
		} catch {
			break;
		}
	}
	return slugs;
}

/** Build hreflang alternates for a given path across all channels */
function buildAlternates(path: string): Record<string, string> {
	const alternates: Record<string, string> = {};
	for (const ch of ALL_CHANNELS) {
		const config = CHANNEL_CONFIG[ch];
		if (config) {
			alternates[config.locale] = `${BASE_URL}/${ch}${path}`;
		}
	}
	// x-default points to the primary/default channel
	alternates["x-default"] = `${BASE_URL}/${DEFAULT_CHANNEL}${path}`;
	return alternates;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	// Fetch data for all channels in parallel
	const [defaultProducts, usdProducts, categories, defaultCollections, usdCollections] =
		await Promise.all([
			fetchAllProductSlugs(DEFAULT_CHANNEL),
			fetchAllProductSlugs("usd"),
			fetchAllCategorySlugs(),
			fetchAllCollectionSlugs(DEFAULT_CHANNEL),
			fetchAllCollectionSlugs("usd"),
		]);

	const entries: MetadataRoute.Sitemap = [];

	// Static pages — generate for each channel with hreflang alternates
	for (const channel of ALL_CHANNELS) {
		entries.push(
			{
				url: `${BASE_URL}/${channel}`,
				lastModified: new Date(),
				changeFrequency: "daily",
				priority: 1,
				alternates: { languages: buildAlternates("") },
			},
			{
				url: `${BASE_URL}/${channel}/products`,
				lastModified: new Date(),
				changeFrequency: "daily",
				priority: 0.9,
				alternates: { languages: buildAlternates("/products") },
			},
		);
	}

	// Product pages — merge slugs from all channels (products may differ per channel)
	const allProductSlugs = new Map<string, string | undefined>();
	for (const p of defaultProducts) allProductSlugs.set(p.slug, p.updatedAt);
	for (const p of usdProducts) {
		if (!allProductSlugs.has(p.slug) || p.updatedAt) {
			allProductSlugs.set(p.slug, p.updatedAt ?? allProductSlugs.get(p.slug));
		}
	}

	for (const [slug, updatedAt] of allProductSlugs) {
		for (const channel of ALL_CHANNELS) {
			entries.push({
				url: `${BASE_URL}/${channel}/products/${slug}`,
				lastModified: updatedAt ? new Date(updatedAt) : new Date(),
				changeFrequency: "weekly",
				priority: 0.8,
				alternates: { languages: buildAlternates(`/products/${slug}`) },
			});
		}
	}

	// Category pages — categories are global, same across channels
	for (const category of categories) {
		for (const channel of ALL_CHANNELS) {
			entries.push({
				url: `${BASE_URL}/${channel}/categories/${category.slug}`,
				lastModified: category.updatedAt
					? new Date(category.updatedAt)
					: new Date(),
				changeFrequency: "weekly",
				priority: 0.7,
				alternates: { languages: buildAlternates(`/categories/${category.slug}`) },
			});
		}
	}

	// Collection pages — merge slugs from both channels
	const allCollectionSlugs = new Set([...defaultCollections, ...usdCollections]);
	for (const slug of allCollectionSlugs) {
		for (const channel of ALL_CHANNELS) {
			entries.push({
				url: `${BASE_URL}/${channel}/collections/${slug}`,
				changeFrequency: "weekly",
				priority: 0.6,
				alternates: { languages: buildAlternates(`/collections/${slug}`) },
			});
		}
	}

	return entries;
}
