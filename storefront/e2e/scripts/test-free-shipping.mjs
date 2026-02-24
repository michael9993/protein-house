/**
 * Test free shipping threshold with ILS channel dropship product.
 * Run: node e2e/scripts/test-free-shipping.mjs
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
	// 1. Find a dropship product in ILS channel
	const prodsResp = await gql(`{
		products(channel: "ils", first: 5, filter: {
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
						pricing { price { gross { amount currency } } }
					}
				}
			}
		}
	}`);

	const prod = prodsResp.data?.products?.edges?.[0]?.node;
	if (!prod) {
		console.log("No dropship products found in ILS channel");
		return;
	}
	const variant =
		prod.variants.find((v) => v.quantityAvailable == null || v.quantityAvailable > 0) ||
		prod.variants[0];
	const price = variant?.pricing?.price?.gross;
	console.log(`Product: "${prod.name}" | Variant: ${variant.id} | Price: ${price?.amount} ${price?.currency}`);

	// 2. Create checkout with qty 3 to exceed 200 ILS threshold
	const qty = price?.amount && price.amount < 200 ? Math.ceil(200 / price.amount) + 1 : 3;
	console.log(`Using qty ${qty} to exceed 200 ILS threshold`);

	const coResp = await gql(
		`mutation CheckoutCreate($input: CheckoutCreateInput!) {
			checkoutCreate(input: $input) {
				checkout {
					id
					subtotalPrice { gross { amount currency } }
				}
				errors { field message }
			}
		}`,
		{
			input: {
				channel: "ils",
				lines: [{ variantId: variant.id, quantity: qty }],
				email: "test-freeship@test.com",
			},
		},
	);

	const co = coResp.data?.checkoutCreate?.checkout;
	if (!co) {
		console.log("Checkout create failed:", JSON.stringify(coResp.data?.checkoutCreate?.errors));
		return;
	}
	console.log(`Checkout: ${co.id} | Subtotal: ${co.subtotalPrice?.gross?.amount} ${co.subtotalPrice?.gross?.currency}`);

	// 3. Set shipping address (Israel)
	const addrResp = await gql(
		`mutation SetAddr($id: ID!, $addr: AddressInput!) {
			checkoutShippingAddressUpdate(id: $id, shippingAddress: $addr) {
				checkout { id }
				errors { field message }
			}
		}`,
		{
			id: co.id,
			addr: {
				firstName: "Test",
				lastName: "User",
				streetAddress1: "123 Herzl St",
				city: "Tel Aviv",
				postalCode: "6100000",
				country: "IL",
				phone: "",
			},
		},
	);

	const addrErrors = addrResp.data?.checkoutShippingAddressUpdate?.errors;
	if (addrErrors?.length) {
		console.log("Address error:", JSON.stringify(addrErrors));
		return;
	}
	console.log("Address set. Waiting 15s for shipping webhook...");

	// 4. Wait for webhook
	await new Promise((r) => setTimeout(r, 15000));

	// 5. Query shipping methods
	const methodsResp = await gql(
		`query CheckoutShipping($id: ID!) {
			checkout(id: $id) {
				shippingMethods {
					id
					name
					price { amount currency }
					active
				}
				subtotalPrice { gross { amount currency } }
			}
		}`,
		{ id: co.id },
	);

	const methods = methodsResp.data?.checkout?.shippingMethods;
	const subtotal = methodsResp.data?.checkout?.subtotalPrice?.gross;
	console.log(`\nSubtotal: ${subtotal?.amount} ${subtotal?.currency}`);
	console.log(`=== Shipping Methods (${methods?.length ?? 0}) ===`);
	if (methods?.length) {
		for (const m of methods) {
			const label = m.price.amount === 0 ? "FREE" : `${m.price.amount} ${m.price.currency}`;
			console.log(`  ${m.name}: ${label}${m.active === false ? " [INACTIVE]" : ""}`);
		}
	} else {
		console.log("  (none)");
	}
}

run().catch(console.error);
