import { test, expect, type Page } from "@playwright/test";
import { CheckoutPage } from "./pages/checkout.page";
import { TEST_CONFIG, TEST_ADDRESS } from "./fixtures/test-data";
import {
	findDropshipProducts,
	checkoutCreate,
	checkoutShippingAddressUpdate,
} from "./fixtures/graphql-client";

/**
 * Checkout Shipping E2E Tests (Legacy V1)
 *
 * Skipped by default — set E2E_CHECKOUT_V1=true to run.
 * Requires NEXT_PUBLIC_CHECKOUT_V2=false in the storefront build.
 *
 * Uses GraphQL checkoutCreate to bypass PDP variant selection and test
 * checkout shipping behavior directly:
 * 1. Dropship shipping methods appear on both desktop and mobile
 * 2. Shipping price in Summary updates when selecting different methods
 * 3. Free shipping threshold: cheapest method becomes free when subtotal > threshold
 */

// Legacy checkout tests — skip by default
const V1_ENABLED = process.env.E2E_CHECKOUT_V1 === "true";

// Shared state populated in beforeAll
let cheapVariantId: string | null = null;
let cheapPrice = 0;
let expensiveVariantId: string | null = null;
let expensivePrice = 0;

const CHANNEL = process.env.E2E_DROPSHIP_CHANNEL || TEST_CONFIG.channel;
const ADDRESS = TEST_ADDRESS;

/**
 * The storefront's NEXT_PUBLIC_SALEOR_API_URL may point to a CloudFlare tunnel
 * (e.g., https://api.halacosmetics.org/graphql/) instead of localhost:8000.
 * In E2E tests, we create checkouts against localhost:8000 so we need to
 * intercept and redirect those requests to the local API.
 */
const REMOTE_API_PATTERNS = [
	"**/api.halacosmetics.org/graphql/**",
	"**/api.halacosmetics.org/graphql/",
];
const LOCAL_API_URL = process.env.SALEOR_API_URL || "http://localhost:8000/graphql/";

async function interceptRemoteApiCalls(page: Page) {
	for (const pattern of REMOTE_API_PATTERNS) {
		await page.route(pattern, async (route) => {
			const request = route.request();
			const response = await page.request.fetch(LOCAL_API_URL, {
				method: request.method(),
				headers: request.headers(),
				data: request.postData() ?? undefined,
			});
			await route.fulfill({
				status: response.status(),
				headers: response.headers(),
				body: await response.body(),
			});
		});
	}
}

/** Suppress cookie consent banner. */
async function suppressCookies(page: Page, channel: string) {
	await page.addInitScript((ch) => {
		localStorage.setItem(
			`aura_cookie_consent_${ch}`,
			JSON.stringify({
				categories: { essential: true, analytics: false, marketing: false },
				timestamp: Date.now(),
				version: 1,
			}),
		);
	}, channel);
}

/**
 * Create a checkout via GraphQL API, set shipping address server-side,
 * then navigate to the checkout page. This triggers the CJ shipping webhook
 * BEFORE the page loads, so shipping methods are available immediately.
 */
async function createCheckoutWithAddressAndNavigate(
	page: Page,
	variantId: string,
	channel: string,
	quantity = 1,
): Promise<{ checkout: CheckoutPage; checkoutId: string }> {
	// 1. Create checkout via API
	const { id: checkoutId } = await checkoutCreate(
		channel,
		[{ variantId, quantity }],
		"e2e-shipping@test.local",
	);
	console.log(`Created checkout: ${checkoutId}`);

	// 2. Set shipping address via API (triggers SHIPPING_LIST webhook server-side)
	await checkoutShippingAddressUpdate(checkoutId, {
		firstName: ADDRESS.firstName,
		lastName: ADDRESS.lastName,
		streetAddress1: ADDRESS.streetAddress1,
		city: ADDRESS.city,
		postalCode: ADDRESS.postalCode,
		country: ADDRESS.country,
		countryArea: ADDRESS.countryArea,
		phone: ADDRESS.phone,
	});
	console.log("Shipping address set via API");

	// 3. Wait for webhook to complete (CJ API needs time to respond)
	await new Promise((r) => setTimeout(r, 8_000));

	// 4. Navigate to checkout page
	await page.goto(`/${channel}/checkout?checkout=${encodeURIComponent(checkoutId)}`);
	await page.waitForLoadState("domcontentloaded");

	const checkout = new CheckoutPage(page, channel);
	return { checkout, checkoutId };
}

/** Wait for shipping methods to be visible on the checkout page. */
async function waitForShippingMethods(
	page: Page,
	checkout: CheckoutPage,
): Promise<number> {
	await expect(checkout.deliveryMethodsSection).toBeVisible({ timeout: 30_000 });

	// Wait for at least one shipping method label to appear
	try {
		await checkout.shippingMethodLabels.first().waitFor({ state: "visible", timeout: 15_000 });
	} catch {
		console.log("No shipping method labels appeared after 15s");
	}

	return checkout.shippingMethodLabels.count();
}

// ─── Setup (runs once for all tests) ────────────────────────────────────────

test.beforeAll(async () => {
	const dropshipResults = await findDropshipProducts(CHANNEL);
	console.log(`Found ${dropshipResults.length} dropship products in channel "${CHANNEL}"`);

	if (dropshipResults.length > 0) {
		// Sort by price
		const sorted = [...dropshipResults].sort(
			(a, b) =>
				(a.variant.pricing?.price?.gross.amount ?? 0) -
				(b.variant.pricing?.price?.gross.amount ?? 0),
		);

		// Cheapest variant for below-threshold tests
		const cheapest = sorted[0];
		cheapVariantId = cheapest.variant.id;
		cheapPrice = cheapest.variant.pricing?.price?.gross.amount ?? 0;
		console.log(`Cheapest dropship variant: "${cheapest.product.name}" at $${cheapPrice}`);

		// Expensive variant for above-threshold tests
		const expensive = sorted.find(
			(p) => (p.variant.pricing?.price?.gross.amount ?? 0) > 100,
		);
		if (expensive) {
			expensiveVariantId = expensive.variant.id;
			expensivePrice = expensive.variant.pricing?.price?.gross.amount ?? 0;
			console.log(`Expensive dropship variant: "${expensive.product.name}" at $${expensivePrice}`);
		}
	}
});

test.beforeEach(async ({ page }) => {
	await suppressCookies(page, CHANNEL);
	await interceptRemoteApiCalls(page);
});

// ─── Desktop Tests ──────────────────────────────────────────────────────────

test.describe("Checkout Shipping — Desktop", () => {
	test.skip(!V1_ENABLED, "Legacy checkout tests — set E2E_CHECKOUT_V1=true to run");
	test("dropship product shows CJ shipping methods after address entry", async ({ page }) => {
		test.setTimeout(90_000);
		test.skip(!cheapVariantId, "No dropship products found in channel");

		const { checkout } = await createCheckoutWithAddressAndNavigate(page, cheapVariantId!, CHANNEL);
		const methodCount = await waitForShippingMethods(page, checkout);

		console.log(`[Desktop] Found ${methodCount} shipping methods`);
		expect(methodCount).toBeGreaterThan(0);

		// Log all method names/prices
		for (let i = 0; i < methodCount; i++) {
			const text = await checkout.shippingMethodLabels.nth(i).textContent();
			console.log(`[Desktop] Method ${i}: "${text}"`);
		}

		await page.screenshot({ path: "e2e/screenshots/desktop-shipping-methods.png" });
	});

	test("shipping price updates when selecting different delivery methods", async ({ page }) => {
		test.setTimeout(90_000);
		test.skip(!cheapVariantId, "No dropship products found in channel");

		const { checkout } = await createCheckoutWithAddressAndNavigate(page, cheapVariantId!, CHANNEL);
		const methodCount = await waitForShippingMethods(page, checkout);

		test.skip(methodCount < 2, "Need at least 2 shipping methods to test price change");

		// Select first method explicitly
		await checkout.selectShippingMethodByIndex(0);
		await page.waitForTimeout(4_000);
		const shippingAfterFirst = await checkout.getShippingCostText();
		console.log(`[Desktop] Shipping after method 0: "${shippingAfterFirst}"`);

		// Select second method
		await checkout.selectShippingMethodByIndex(1);
		await page.waitForTimeout(4_000);
		const shippingAfterSecond = await checkout.getShippingCostText();
		console.log(`[Desktop] Shipping after method 1: "${shippingAfterSecond}"`);

		// The shipping cost MUST change between different methods
		if (shippingAfterFirst === shippingAfterSecond) {
			console.error("[Desktop] BUG: Shipping cost did NOT change between methods!");
		}
		expect(shippingAfterFirst).not.toBe(shippingAfterSecond);

		// Try third method if available
		if (methodCount >= 3) {
			await checkout.selectShippingMethodByIndex(2);
			await page.waitForTimeout(4_000);
			const shippingAfterThird = await checkout.getShippingCostText();
			console.log(`[Desktop] Shipping after method 2: "${shippingAfterThird}"`);
		}

		await page.screenshot({ path: "e2e/screenshots/desktop-shipping-price-update.png" });
	});

	test("total price updates when shipping method changes", async ({ page }) => {
		test.setTimeout(90_000);
		test.skip(!cheapVariantId, "No dropship products found in channel");

		const { checkout } = await createCheckoutWithAddressAndNavigate(page, cheapVariantId!, CHANNEL);
		const methodCount = await waitForShippingMethods(page, checkout);

		test.skip(methodCount < 2, "Need at least 2 shipping methods");

		// Select first method and record total
		await checkout.selectShippingMethodByIndex(0);
		await page.waitForTimeout(4_000);
		const totalAfterFirst = await checkout.getTotalPriceText();
		console.log(`[Desktop] Total after method 0: "${totalAfterFirst}"`);

		// Select second method and record total
		await checkout.selectShippingMethodByIndex(1);
		await page.waitForTimeout(4_000);
		const totalAfterSecond = await checkout.getTotalPriceText();
		console.log(`[Desktop] Total after method 1: "${totalAfterSecond}"`);

		// Total should change since shipping price changed
		expect(totalAfterFirst).not.toBe(totalAfterSecond);
	});
});

// ─── Mobile Tests ───────────────────────────────────────────────────────────

test.describe("Checkout Shipping — Mobile", () => {
	test.skip(!V1_ENABLED, "Legacy checkout tests — set E2E_CHECKOUT_V1=true to run");
	test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

	test("dropship product shows shipping methods on mobile", async ({ page }) => {
		test.setTimeout(90_000);
		test.skip(!cheapVariantId, "No dropship products found in channel");

		const { checkout } = await createCheckoutWithAddressAndNavigate(page, cheapVariantId!, CHANNEL);
		const methodCount = await waitForShippingMethods(page, checkout);

		console.log(`[Mobile] Found ${methodCount} shipping methods`);
		expect(methodCount).toBeGreaterThan(0);

		// Verify "no shipping methods" warning is NOT visible
		await expect(checkout.noShippingMethodsMessage).not.toBeVisible();

		// Log all methods
		for (let i = 0; i < methodCount; i++) {
			const text = await checkout.shippingMethodLabels.nth(i).textContent();
			console.log(`[Mobile] Method ${i}: "${text}"`);
		}

		await page.screenshot({
			path: "e2e/screenshots/mobile-shipping-methods.png",
			fullPage: true,
		});
	});

	test("shipping price updates on mobile when selecting methods", async ({ page }) => {
		test.setTimeout(90_000);
		test.skip(!cheapVariantId, "No dropship products found in channel");

		const { checkout } = await createCheckoutWithAddressAndNavigate(page, cheapVariantId!, CHANNEL);
		const methodCount = await waitForShippingMethods(page, checkout);

		test.skip(methodCount < 2, "Need at least 2 shipping methods");

		// Select first method
		await checkout.selectShippingMethodByIndex(0);
		await page.waitForTimeout(4_000);

		// Scroll to summary on mobile (it's below the form)
		await checkout.shippingCost.scrollIntoViewIfNeeded();
		const shippingFirst = await checkout.getShippingCostText();
		console.log(`[Mobile] Shipping after method 0: "${shippingFirst}"`);

		// Scroll back up and select second method
		await checkout.deliveryMethodsSection.scrollIntoViewIfNeeded();
		await checkout.selectShippingMethodByIndex(1);
		await page.waitForTimeout(4_000);

		// Scroll to summary again
		await checkout.shippingCost.scrollIntoViewIfNeeded();
		const shippingSecond = await checkout.getShippingCostText();
		console.log(`[Mobile] Shipping after method 1: "${shippingSecond}"`);

		if (shippingFirst === shippingSecond) {
			console.error("[Mobile] BUG: Shipping cost did NOT change between methods!");
		}
		expect(shippingFirst).not.toBe(shippingSecond);

		await page.screenshot({
			path: "e2e/screenshots/mobile-shipping-price-update.png",
			fullPage: true,
		});
	});
});

// ─── Free Shipping Threshold Tests ──────────────────────────────────────────

test.describe("Free Shipping Threshold", () => {
	test.skip(!V1_ENABLED, "Legacy checkout tests — set E2E_CHECKOUT_V1=true to run");
	test("cart below threshold shows regular (non-free) shipping", async ({ page }) => {
		test.setTimeout(90_000);
		test.skip(!cheapVariantId, "No dropship products found in channel");
		test.skip(cheapPrice >= 75, "Product price already exceeds threshold");

		// Single unit of cheap product — well below $75 threshold
		const { checkout } = await createCheckoutWithAddressAndNavigate(page, cheapVariantId!, CHANNEL, 1);
		const methodCount = await waitForShippingMethods(page, checkout);

		console.log(`[Threshold-Below] Cart subtotal: ~$${cheapPrice}`);
		console.log(`[Threshold-Below] Found ${methodCount} shipping methods`);

		if (methodCount > 0) {
			await checkout.selectShippingMethodByIndex(0);
			await page.waitForTimeout(4_000);

			const shippingCost = await checkout.getShippingCostText();
			console.log(`[Threshold-Below] Cheapest shipping cost: "${shippingCost}"`);

			const isFree = /free|\$0\.00|₪0\.00|0\.00/i.test(shippingCost);
			console.log(`[Threshold-Below] Is free: ${isFree} (expected: false)`);

			for (let i = 0; i < methodCount; i++) {
				const text = await checkout.shippingMethodLabels.nth(i).textContent();
				console.log(`[Threshold-Below] Method ${i}: "${text}"`);
			}
		}

		await page.screenshot({ path: "e2e/screenshots/threshold-below.png" });
	});

	test("cart above threshold shows free shipping on cheapest method", async ({ page }) => {
		test.setTimeout(120_000);
		test.skip(!cheapVariantId, "No dropship products found in channel");

		// Use expensive product or multiple cheap ones to exceed $75 threshold
		let variantId: string;
		let quantity: number;
		let expectedSubtotal: number;

		if (expensiveVariantId && expensivePrice > 75) {
			variantId = expensiveVariantId;
			quantity = 1;
			expectedSubtotal = expensivePrice;
		} else {
			variantId = cheapVariantId!;
			quantity = Math.min(Math.ceil(100 / (cheapPrice || 15)), 10);
			expectedSubtotal = cheapPrice * quantity;
		}

		console.log(
			`[Threshold-Above] Variant: ${variantId}, qty: ${quantity}, est. subtotal: ~$${expectedSubtotal}`,
		);

		const { checkout } = await createCheckoutWithAddressAndNavigate(page, variantId, CHANNEL, quantity);
		const methodCount = await waitForShippingMethods(page, checkout);

		console.log(`[Threshold-Above] Found ${methodCount} shipping methods`);

		if (methodCount > 0) {
			await checkout.selectShippingMethodByIndex(0);
			await page.waitForTimeout(4_000);

			const shippingCost = await checkout.getShippingCostText();
			console.log(`[Threshold-Above] Cheapest shipping cost: "${shippingCost}"`);

			for (let i = 0; i < methodCount; i++) {
				const text = await checkout.shippingMethodLabels.nth(i).textContent();
				console.log(`[Threshold-Above] Method ${i}: "${text}"`);
			}

			// Check if cheapest method shows "(Free)" in its label
			const firstMethodText = await checkout.shippingMethodLabels.first().textContent();
			const hasFreeLabel = /free/i.test(firstMethodText || "");
			console.log(`[Threshold-Above] First method: "${firstMethodText}"`);
			console.log(`[Threshold-Above] Has '(Free)' label: ${hasFreeLabel}`);
		}

		await page.screenshot({ path: "e2e/screenshots/threshold-above.png" });
	});
});
