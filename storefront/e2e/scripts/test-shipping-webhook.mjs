/**
 * Quick test: Create checkout with dropship product, set address, check shipping methods.
 * Run: node e2e/scripts/test-shipping-webhook.mjs
 */
const API_URL = process.env.SALEOR_API_URL || "http://localhost:8000/graphql/";

async function gql(query, variables) {
	const resp = await fetch(API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query, variables }),
	});
	return resp.json();
}

async function run() {
	// 1. Find a dropship product
	const prodsResp = await gql(`{
		products(channel: "usd", first: 5, filter: {
			isPublished: true,
			metadata: [{ key: "dropship.supplier" }]
		}) {
			edges {
				node {
					name
					variants {
						id
						name
						quantityAvailable
					}
				}
			}
		}
	}`);

	const prod = prodsResp.data?.products?.edges?.[0]?.node;
	if (!prod) {
		console.log("No dropship products found");
		return;
	}
	const variant =
		prod.variants.find((v) => v.quantityAvailable == null || v.quantityAvailable > 0) ||
		prod.variants[0];
	console.log(`Product: "${prod.name}" | Variant: ${variant.id}`);

	// 2. Create checkout
	const coResp = await gql(
		`mutation CheckoutCreate($input: CheckoutCreateInput!) {
			checkoutCreate(input: $input) {
				checkout { id token }
				errors { field message }
			}
		}`,
		{
			input: {
				channel: "usd",
				lines: [{ variantId: variant.id, quantity: 1 }],
				email: "test-webhook@test.com",
			},
		},
	);

	const co = coResp.data?.checkoutCreate?.checkout;
	if (!co) {
		console.log("Checkout create failed:", JSON.stringify(coResp.data?.checkoutCreate?.errors));
		return;
	}
	console.log(`Checkout: ${co.id}`);

	// 3. Set shipping address
	const addrResp = await gql(
		`mutation CheckoutShippingAddressUpdate($id: ID!, $address: AddressInput!) {
			checkoutShippingAddressUpdate(id: $id, shippingAddress: $address) {
				checkout { id }
				errors { field message code }
			}
		}`,
		{
			id: co.id,
			address: {
				firstName: "Test",
				lastName: "User",
				streetAddress1: "123 Test St",
				city: "New York",
				postalCode: "10001",
				country: "US",
				countryArea: "NY",
				phone: "+12125551234",
			},
		},
	);

	const addrErrors = addrResp.data?.checkoutShippingAddressUpdate?.errors;
	if (addrErrors?.length) {
		console.log("Address error:", JSON.stringify(addrErrors));
		return;
	}
	console.log("Address set. Waiting 12s for webhook...");

	// 4. Wait for webhook to complete
	await new Promise((r) => setTimeout(r, 12000));

	// 5. Query shipping methods
	const methodsResp = await gql(
		`query CheckoutShipping($id: ID!) {
			checkout(id: $id) {
				shippingMethods {
					id
					name
					price { amount currency }
				}
			}
		}`,
		{ id: co.id },
	);

	const methods = methodsResp.data?.checkout?.shippingMethods;
	console.log(`\n=== Shipping Methods (${methods?.length ?? 0}) ===`);
	if (methods?.length) {
		for (const m of methods) {
			console.log(`  ${m.name}: ${m.price.amount} ${m.price.currency}`);
		}
	} else {
		console.log("  (none)");
	}
}

run().catch(console.error);
