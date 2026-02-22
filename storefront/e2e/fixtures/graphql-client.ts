/**
 * Standalone GraphQL client for E2E test setup/teardown.
 * Talks directly to the Saleor API at localhost:8000, bypassing the storefront.
 */
const API_URL = process.env.SALEOR_API_URL || "http://localhost:8000/graphql/";

interface GraphQLResponse<T> {
	data?: T;
	errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

async function graphql<T>(
	query: string,
	variables?: Record<string, unknown>,
	token?: string,
): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const response = await fetch(API_URL, {
		method: "POST",
		headers,
		body: JSON.stringify({ query, variables }),
	});

	const json = (await response.json()) as GraphQLResponse<T>;

	if (json.errors?.length) {
		throw new Error(`GraphQL Error: ${json.errors.map((e) => e.message).join(", ")}`);
	}
	if (!json.data) {
		throw new Error("GraphQL response missing data");
	}
	return json.data;
}

export async function shopInfo(): Promise<{ shop: { name: string } }> {
	return graphql("{ shop { name } }");
}

export async function tokenCreate(
	email: string,
	password: string,
): Promise<{ token: string; refreshToken: string; user: { id: string; email: string } }> {
	const data = await graphql<{
		tokenCreate: {
			token: string | null;
			refreshToken: string | null;
			errors: Array<{ field: string; message: string }>;
			user: { id: string; email: string } | null;
		};
	}>(
		`mutation TokenCreate($email: String!, $password: String!) {
			tokenCreate(email: $email, password: $password) {
				token
				refreshToken
				errors { field message }
				user { id email }
			}
		}`,
		{ email, password },
	);

	if (data.tokenCreate.errors.length) {
		throw new Error(
			`Login failed: ${data.tokenCreate.errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
		);
	}

	return {
		token: data.tokenCreate.token!,
		refreshToken: data.tokenCreate.refreshToken!,
		user: data.tokenCreate.user!,
	};
}

export async function accountRegister(
	email: string,
	password: string,
	channel: string,
	firstName = "E2E",
	lastName = "Test",
): Promise<{ id: string; email: string }> {
	const data = await graphql<{
		accountRegister: {
			user: { id: string; email: string } | null;
			errors: Array<{ field: string; message: string; code: string }>;
		};
	}>(
		`mutation Register($input: AccountRegisterInput!) {
			accountRegister(input: $input) {
				user { id email }
				errors { field message code }
			}
		}`,
		{
			input: {
				email,
				password,
				firstName,
				lastName,
				channel,
				redirectUrl: "http://localhost:3000/confirm-email",
			},
		},
	);

	if (data.accountRegister.errors.length) {
		throw new Error(
			`Registration failed: ${data.accountRegister.errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
		);
	}

	return data.accountRegister.user!;
}

interface ProductVariant {
	id: string;
	name: string;
	sku: string | null;
	quantityAvailable: number | null;
	pricing: {
		price: { gross: { amount: number; currency: string } } | null;
	} | null;
}

interface Product {
	id: string;
	name: string;
	slug: string;
	variants: ProductVariant[] | null;
}

export async function productList(
	channel: string,
	first = 10,
): Promise<Product[]> {
	const data = await graphql<{
		products: { edges: Array<{ node: Product }> };
	}>(
		`query Products($channel: String!, $first: Int!) {
			products(channel: $channel, first: $first, filter: { isPublished: true, stockAvailability: IN_STOCK }) {
				edges {
					node {
						id
						name
						slug
						variants {
							id
							name
							sku
							quantityAvailable
							pricing(address: {}) {
								price {
									gross { amount currency }
								}
							}
						}
					}
				}
			}
		}`,
		{ channel, first },
	);

	return data.products.edges.map((e) => e.node);
}

export async function findInStockProduct(
	channel: string,
): Promise<{ product: Product; variant: ProductVariant }> {
	const products = await productList(channel);

	for (const product of products) {
		const variant = product.variants?.find(
			(v) => v.quantityAvailable !== null && v.quantityAvailable > 0,
		);
		if (variant) {
			return { product, variant };
		}
	}

	throw new Error(`No in-stock products found in channel ${channel}`);
}

export async function checkoutCreate(
	channel: string,
	lines: Array<{ variantId: string; quantity: number }>,
	email?: string,
): Promise<{ id: string; token: string }> {
	const data = await graphql<{
		checkoutCreate: {
			checkout: { id: string; token: string } | null;
			errors: Array<{ field: string; message: string }>;
		};
	}>(
		`mutation CheckoutCreate($input: CheckoutCreateInput!) {
			checkoutCreate(input: $input) {
				checkout { id token }
				errors { field message }
			}
		}`,
		{
			input: {
				channel,
				lines,
				email: email || "e2e-checkout@test.local",
			},
		},
	);

	if (data.checkoutCreate.errors.length) {
		throw new Error(
			`Checkout creation failed: ${data.checkoutCreate.errors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
		);
	}

	return data.checkoutCreate.checkout!;
}
