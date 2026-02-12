import { Suspense } from "react";
import { executeGraphQL } from "@/lib/graphql";
import { MenuGetBySlugDocument, CategoriesForNavDocument } from "@/gql/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { storeConfig } from "@/config";
import { NavLinksClient, type CategoryWithChildren } from "./NavLinksClient";
import type { MobileNavData } from "./NavLinksClient";

async function fetchCollectionsForNav(channel: string): Promise<Array<{ id: string; name: string; slug: string }>> {
	try {
		// Use SALEOR_API_URL for server-side (available in server context)
		let apiUrl = process.env.SALEOR_API_URL;
		if (!apiUrl) {
			console.warn("SALEOR_API_URL not set, skipping collections fetch");
			return [];
		}

		// Ensure the URL ends with /graphql/ for GraphQL requests
		if (!apiUrl.endsWith('/graphql/') && !apiUrl.endsWith('/graphql')) {
			apiUrl = `${apiUrl.replace(/\/+$/, '')}/graphql/`;
		} else if (apiUrl.endsWith('/graphql')) {
			apiUrl = `${apiUrl}/`;
		}

		const response = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: `
					query CollectionsForNav($channel: String!, $languageCode: LanguageCodeEnum!) {
						collections(channel: $channel, first: 20) {
							edges {
								node {
									id
									name
									translation(languageCode: $languageCode) { name }
									slug
									products(first: 1) {
										totalCount
									}
								}
							}
						}
					}
				`,
				variables: { channel, languageCode: getLanguageCodeForChannel(channel) },
			}),
			cache: "force-cache",
			next: { revalidate: 60 * 60 }, // Revalidate every hour
		});

		if (!response.ok) {
			console.warn(`Failed to fetch collections: ${response.status} ${response.statusText}`);
			return [];
		}

		const result = await response.json() as { data?: any; errors?: any[] };
		
		if (result.errors) {
			console.warn("GraphQL errors fetching collections:", result.errors);
			return [];
		}

		if (!result.data?.collections?.edges) return [];

		return result.data.collections.edges
			.map((edge: any) => ({
				id: edge.node.id,
				name: edge.node.translation?.name || edge.node.name,
				slug: edge.node.slug,
				productCount: edge.node.products?.totalCount || 0,
			}))
			.filter((col: any) => col.productCount > 0)
			.slice(0, 20); // Limit to 20 collections
	} catch (error) {
		console.warn("Failed to fetch collections for navigation:", error);
		return [];
	}
}

async function fetchBrandsForNav(channel: string): Promise<Array<{ id: string; name: string; slug: string }>> {
	try {
		// Use SALEOR_API_URL for server-side (available in server context)
		let apiUrl = process.env.SALEOR_API_URL;
		if (!apiUrl) {
			console.warn("SALEOR_API_URL not set, skipping brands fetch");
			return [];
		}

		// Ensure the URL ends with /graphql/ for GraphQL requests
		if (!apiUrl.endsWith('/graphql/') && !apiUrl.endsWith('/graphql')) {
			apiUrl = `${apiUrl.replace(/\/+$/, '')}/graphql/`;
		} else if (apiUrl.endsWith('/graphql')) {
			apiUrl = `${apiUrl}/`;
		}

		// Query the brand attribute directly to get ALL brand values
		// This is much more reliable than extracting from a limited product query
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: `
					query BrandAttributeChoices($languageCode: LanguageCodeEnum!) {
						attributes(filter: { slugs: ["brand"] }, first: 1) {
							edges {
								node {
									id
									slug
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
			cache: "force-cache",
			next: { revalidate: 60 * 60 }, // Revalidate every hour
		});

		if (!response.ok) {
			console.warn(`Failed to fetch brands: ${response.status} ${response.statusText}`);
			return [];
		}

		const result = await response.json() as { data?: any; errors?: any[] };

		if (result.errors) {
			console.warn("GraphQL errors fetching brands:", result.errors);
			return [];
		}

		const attrNode = result.data?.attributes?.edges?.[0]?.node;
		if (!attrNode?.choices?.edges) return [];

		const brands: Array<{ id: string; name: string; slug: string }> = [];
		const seen = new Set<string>();

		for (const edge of attrNode.choices.edges) {
			const value = edge.node;
			const brandName = (value?.translation?.name || value?.name)?.trim();
			if (!brandName) continue;

			const dedupKey = brandName.toLowerCase();
			if (seen.has(dedupKey)) continue;
			seen.add(dedupKey);

			brands.push({
				id: value.id || `brand-${value.slug}`,
				name: brandName,
				slug: value.slug || dedupKey.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
			});
		}

		return brands.sort((a, b) => a.name.localeCompare(b.name));
	} catch (error) {
		console.warn("Failed to fetch brands for navigation:", error);
		return [];
	}
}

function mapCategoryChild(node: { id: string; name: string; slug: string; translation?: { name?: string | null } | null; products?: { totalCount?: number | null } | null; children?: { edges?: Array<{ node: any }> } | null }): CategoryWithChildren {
	const children = node.children?.edges?.map((childEdge: { node: any }) => mapCategoryChild(childEdge.node)).filter(Boolean) ?? [];
	return {
		id: node.id,
		name: node.translation?.name || node.name,
		slug: node.slug,
		productCount: node.products?.totalCount ?? undefined,
		children: children.length > 0 ? children : undefined,
	};
}

function mapCategory(edge: { node: any }): CategoryWithChildren {
	const node = edge.node;
	const children = node.children?.edges?.map((childEdge: { node: any }) => mapCategoryChild(childEdge.node)).filter(Boolean) ?? [];
	return {
		id: node.id,
		name: node.translation?.name || node.name,
		slug: node.slug,
		description: node.translation?.description || node.description,
		backgroundImage: node.backgroundImage ? { url: node.backgroundImage.url, alt: node.backgroundImage.alt } : null,
		productCount: node.products?.totalCount ?? undefined,
		children: children.length > 0 ? children : undefined,
	};
}

/** Shared nav data for desktop NavLinks and mobile menu. Used by layout to pass once. */
export async function getNavData(channel: string): Promise<MobileNavData> {
	const languageCode = getLanguageCodeForChannel(channel);
	const [categoriesData, collectionsData, brandsData] = await Promise.all([
		executeGraphQL(CategoriesForNavDocument, {
			variables: { channel, first: 10, languageCode },
			revalidate: 60 * 60,
		}).catch(() => ({ categories: null })),
		fetchCollectionsForNav(channel),
		fetchBrandsForNav(channel),
	]);
	const categories: CategoryWithChildren[] = (categoriesData.categories?.edges || []).map(mapCategory);
	return { categories, collections: collectionsData || [], brands: brandsData || [] };
}

export const NavLinks = async ({ channel, navData: providedNavData }: { channel: string; navData?: MobileNavData }) => {
	let categories: CategoryWithChildren[];
	let collections: Array<{ id: string; name: string; slug: string }>;
	let brands: Array<{ id: string; name: string; slug: string }>;

	if (providedNavData) {
		categories = providedNavData.categories;
		collections = providedNavData.collections;
		brands = providedNavData.brands;
	} else {
		const languageCode = getLanguageCodeForChannel(channel);
		const [navLinks, categoriesData, collectionsData, brandsData, dynamicConfig] = await Promise.all([
			executeGraphQL(MenuGetBySlugDocument, { variables: { slug: "navbar", channel, languageCode }, revalidate: 60 * 60 * 24 }),
			executeGraphQL(CategoriesForNavDocument, { variables: { channel, first: 10, languageCode }, revalidate: 60 * 60 }).catch(() => ({ categories: null })),
			fetchCollectionsForNav(channel),
			fetchBrandsForNav(channel),
			fetchStorefrontConfig(channel).catch(() => null),
		]);
		categories = (categoriesData.categories?.edges || []).map((e: { node: any }) => mapCategory(e));
		collections = collectionsData || [];
		brands = brandsData || [];
	}

	return (
		<Suspense fallback={<div className="h-10 w-64 animate-pulse rounded bg-neutral-100" />}>
			<NavLinksClient
				categories={categories}
				collections={collections}
				brands={brands}
				channel={channel}
			/>
		</Suspense>
	);
};
