import type { MetadataRoute } from "next";
import { executeGraphQL } from "@/lib/graphql";

const BASE_URL =
	process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000";
const DEFAULT_CHANNEL =
	process.env.NEXT_PUBLIC_DEFAULT_CHANNEL || "default-channel";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const channel = DEFAULT_CHANNEL;

	// Fetch all data in parallel
	const [products, categories, collections] = await Promise.all([
		fetchAllProductSlugs(channel),
		fetchAllCategorySlugs(),
		fetchAllCollectionSlugs(channel),
	]);

	const entries: MetadataRoute.Sitemap = [];

	// Static pages
	entries.push(
		{
			url: `${BASE_URL}/${channel}`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 1,
		},
		{
			url: `${BASE_URL}/${channel}/products`,
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: `${BASE_URL}/${channel}/login`,
			changeFrequency: "monthly",
			priority: 0.3,
		},
		{
			url: `${BASE_URL}/${channel}/register`,
			changeFrequency: "monthly",
			priority: 0.3,
		},
	);

	// Product pages
	for (const product of products) {
		entries.push({
			url: `${BASE_URL}/${channel}/products/${product.slug}`,
			lastModified: product.updatedAt
				? new Date(product.updatedAt)
				: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		});
	}

	// Category pages
	for (const category of categories) {
		entries.push({
			url: `${BASE_URL}/${channel}/categories/${category.slug}`,
			lastModified: category.updatedAt
				? new Date(category.updatedAt)
				: new Date(),
			changeFrequency: "weekly",
			priority: 0.7,
		});
	}

	// Collection pages
	for (const slug of collections) {
		entries.push({
			url: `${BASE_URL}/${channel}/collections/${slug}`,
			changeFrequency: "weekly",
			priority: 0.6,
		});
	}

	return entries;
}
