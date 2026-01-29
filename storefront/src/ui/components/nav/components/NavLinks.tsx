import { Suspense } from "react";
import { executeGraphQL } from "@/lib/graphql";
import { MenuGetBySlugDocument, CategoriesForNavDocument } from "@/gql/graphql";
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
					query CollectionsForNav($channel: String!) {
						collections(channel: $channel, first: 20) {
							edges {
								node {
									id
									name
									slug
									products(first: 1) {
										totalCount
									}
								}
							}
						}
					}
				`,
				variables: { channel },
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
				name: edge.node.name,
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

		const response = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: `
					query ProductsForBrands($channel: String!) {
						products(first: 50, channel: $channel) {
							edges {
								node {
									attributes {
										attribute {
											name
											slug
										}
										values {
											id
											name
											slug
										}
									}
								}
							}
						}
					}
				`,
				variables: { channel },
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

		if (!result.data?.products?.edges) return [];

		const brandsMap = new Map<string, { id: string; name: string; slug: string }>();

		result.data.products.edges.forEach((edge: any) => {
			const product = edge.node;
			if (!product.attributes) return;

			const brandAttr = product.attributes.find((attr: any) => {
				const attrName = attr?.attribute?.name?.toLowerCase()?.trim();
				const attrSlug = attr?.attribute?.slug?.toLowerCase()?.trim();
				return attrName === "brand" || attrSlug === "brand" || attrSlug === "manufacturer";
			});

			if (brandAttr?.values) {
				brandAttr.values.forEach((value: any) => {
					if (value.id && value.name && !brandsMap.has(value.id)) {
						brandsMap.set(value.id, {
							id: value.id,
							name: value.name,
							slug: value.slug || value.id,
						});
					}
				});
			}
		});

		return Array.from(brandsMap.values()).slice(0, 10); // Limit to 10 brands
	} catch (error) {
		console.warn("Failed to fetch brands for navigation:", error);
		return [];
	}
}

function mapCategoryChild(node: { id: string; name: string; slug: string; products?: { totalCount?: number | null } | null; children?: { edges?: Array<{ node: any }> } | null }): CategoryWithChildren {
	const children = node.children?.edges?.map((childEdge: { node: any }) => mapCategoryChild(childEdge.node)).filter(Boolean) ?? [];
	return {
		id: node.id,
		name: node.name,
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
		name: node.name,
		slug: node.slug,
		description: node.description,
		backgroundImage: node.backgroundImage ? { url: node.backgroundImage.url, alt: node.backgroundImage.alt } : null,
		productCount: node.products?.totalCount ?? undefined,
		children: children.length > 0 ? children : undefined,
	};
}

/** Shared nav data for desktop NavLinks and mobile menu. Used by layout to pass once. */
export async function getNavData(channel: string): Promise<MobileNavData> {
	const [categoriesData, collectionsData, brandsData] = await Promise.all([
		executeGraphQL(CategoriesForNavDocument, {
			variables: { channel, first: 10 },
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
		const [navLinks, categoriesData, collectionsData, brandsData, dynamicConfig] = await Promise.all([
			executeGraphQL(MenuGetBySlugDocument, { variables: { slug: "navbar", channel }, revalidate: 60 * 60 * 24 }),
			executeGraphQL(CategoriesForNavDocument, { variables: { channel, first: 10 }, revalidate: 60 * 60 }).catch(() => ({ categories: null })),
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
