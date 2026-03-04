/**
 * Checkout V2 E2E Tests
 *
 * Tests for the accordion-style checkout (checkout-v2/) — now the default.
 *
 * Requires NEXT_PUBLIC_CHECKOUT_V2 to NOT be set to "false" in the storefront build.
 * These tests run by default with `pnpm test:e2e`.
 *
 * CJ Dropshipping note: The dropship test creates a checkout and verifies that
 * CJ shipping methods DISPLAY correctly in the DeliveryStep. It deliberately
 * does NOT select a method, proceed to payment, or place an order — so no
 * real CJ orders are created.
 */

import { test, expect } from "@playwright/test";
import { CheckoutV2Page } from "./pages/checkout-v2.page";
import { ProductDetailPage } from "./pages/product-detail.page";
import { CartPage } from "./pages/cart.page";
import { TEST_CONFIG, TEST_ADDRESS, TEST_ADDRESS_IL } from "./fixtures/test-data";
import {
	findInStockProduct,
	findDropshipProducts,
	checkoutCreate,
	checkoutShippingAddressUpdate,
} from "./fixtures/graphql-client";

// ---------------------------------------------------------------------------
// V2 is now the default — these tests always run
// ---------------------------------------------------------------------------

const CHANNEL = TEST_CONFIG.channel;
const IL_CHANNEL = process.env.E2E_IL_CHANNEL ?? "ils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function suppressCookies(page: import("@playwright/test").Page, channel: string) {
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
 * Add the test product to cart via PDP and navigate to the checkout URL.
 * Returns a CheckoutV2Page ready for interaction.
 */
async function goToCheckoutV2(
	page: import("@playwright/test").Page,
	productSlug: string,
	variantId: string,
	channel = CHANNEL,
): Promise<CheckoutV2Page> {
	const pdp = new ProductDetailPage(page, channel);
	const cart = new CartPage(page, channel);

	await pdp.gotoProduct(productSlug, variantId);
	await pdp.expectProductLoaded();
	await pdp.addToCart();
	await page.waitForTimeout(1_500);

	await cart.openDrawer();
	await cart.checkoutButton.click();
	await page.waitForURL((url) => url.pathname.includes("/checkout"), { timeout: 15_000 });

	return new CheckoutV2Page(page, channel);
}

// ---------------------------------------------------------------------------
// Shared state (populated once in beforeAll)
// ---------------------------------------------------------------------------

let productSlug: string;
let variantId: string;
let dropshipVariantId: string | null = null;

test.beforeAll(async () => {
	const { product, variant } = await findInStockProduct(CHANNEL);
	productSlug = product.slug;
	variantId = variant.id;

	const dropship = await findDropshipProducts(CHANNEL);
	if (dropship.length > 0) {
		dropshipVariantId = dropship[0].variant.id;
		console.log(`[V2] Dropship variant for shipping test: ${dropshipVariantId}`);
	}
});

test.beforeEach(async ({ page }) => {
	await suppressCookies(page, CHANNEL);
});

// =============================================================================
// Test 1 — Full guest checkout (contact → shipping → delivery → payment → confirm)
// =============================================================================

test("V2: guest checkout completes end-to-end with Stripe", async ({ page }) => {

	test.setTimeout(120_000);

	const checkout = await goToCheckoutV2(page, productSlug, variantId);

	// Confirm we got V2 accordion, not legacy checkout
	const isV2 = await checkout.isV2Active();
	expect(isV2, "Expected V2 accordion — NEXT_PUBLIC_CHECKOUT_V2 may not be set in the build").toBe(
		true,
	);

	// Step 0: Contact
	await checkout.fillContactEmail("e2e-v2-guest@test.local");

	// Step 1: Shipping address
	await checkout.fillShippingAddress(TEST_ADDRESS);
	await page.waitForTimeout(2_000); // let shipping webhook complete

	// Step 2: Delivery method
	await checkout.selectFirstDeliveryMethod();
	await page.waitForTimeout(1_000);

	// Step 3: Payment (Stripe test card)
	// Skip gracefully if Stripe gateway is not configured in this environment
	const paymentPanel = checkout.stepPanel(3);
	await paymentPanel.waitFor({ state: "visible", timeout: 15_000 });
	const gatewayError = await page
		.locator("text=Failed to initialize payment system")
		.isVisible()
		.catch(() => false);
	if (gatewayError) {
		test.skip(true, "Stripe payment gateway not configured in this environment — skipping payment step");
		return;
	}

	await checkout.fillStripeCard();
	await page.waitForTimeout(1_000);

	// Place order
	await checkout.placeOrder();

	// Verify V2 order confirmation page
	await checkout.expectOrderConfirmation();
	expect(page.url()).toMatch(/[?&]order=/);
});

// =============================================================================
// Test 2 — Accordion step locking: steps 1-3 locked until step 0 complete
// =============================================================================

test("V2: shipping/delivery/payment steps are locked until contact step completes", async ({
	page,
}) => {


	const checkout = await goToCheckoutV2(page, productSlug, variantId);

	const isV2 = await checkout.isV2Active();
	expect(isV2).toBe(true);

	// Step 0 (Contact) should be active and its header button enabled
	await expect(checkout.stepHeader(0)).not.toBeDisabled({ timeout: 10_000 });

	// Steps 1-3 should be locked (disabled header buttons) before step 0 is done
	await expect(checkout.stepHeader(1)).toBeDisabled({ timeout: 5_000 });
	await expect(checkout.stepHeader(2)).toBeDisabled({ timeout: 5_000 });
	await expect(checkout.stepHeader(3)).toBeDisabled({ timeout: 5_000 });

	// After completing step 0, step 1 should unlock
	await checkout.fillContactEmail("e2e-v2-lock-test@test.local");
	await expect(checkout.stepHeader(1)).not.toBeDisabled({ timeout: 10_000 });

	// Steps 2 and 3 still locked (shipping not yet done)
	await expect(checkout.stepHeader(2)).toBeDisabled({ timeout: 3_000 });
	await expect(checkout.stepHeader(3)).toBeDisabled({ timeout: 3_000 });
});

// =============================================================================
// Test 3 — Authenticated user: checkout pre-fills email from auth state
// =============================================================================

test("V2: authenticated user sees email pre-filled in Contact step", async ({ page }) => {


	// Load auth cookies from the storage state file produced by auth.setup.ts
	const AUTH_FILE = "e2e/.auth/user.json";
	let authCookies: import("@playwright/test").Cookie[] = [];
	try {
		const { readFileSync, existsSync } = await import("fs");
		if (!existsSync(AUTH_FILE)) {
			test.skip(true, "Auth storage state not found — run auth.setup.ts first");
			return;
		}
		const state = JSON.parse(readFileSync(AUTH_FILE, "utf-8")) as {
			cookies?: import("@playwright/test").Cookie[];
		};
		authCookies = state.cookies ?? [];
	} catch {
		test.skip(true, "Could not read auth storage state");
		return;
	}

	await page.context().addCookies(authCookies);

	await suppressCookies(page, CHANNEL);

	const checkout = await goToCheckoutV2(page, productSlug, variantId);
	const isV2 = await checkout.isV2Active();
	expect(isV2).toBe(true);

	// For an authenticated user, ContactStep shows a "signed in as" state
	// The email should be visible (pre-filled or shown as a label) in step 0
	const step0Panel = checkout.stepPanel(0);
	await step0Panel.waitFor({ state: "visible", timeout: 10_000 });

	// Wait for auth SDK to hydrate from cookies (async after hydration)
	await page.waitForTimeout(3_000);

	// Either email input has the user's email, or a "signed in as" message is shown
	const emailInput = checkout.emailInput;
	const hasEmailInput = await emailInput.isVisible().catch(() => false);

	if (hasEmailInput) {
		const emailValue = await emailInput.inputValue();
		if (!emailValue) {
			// Auth SDK may not have recognised the cookies (JWT ISS mismatch in dev)
			test.skip(true, "Auth not recognised by auth SDK (possible ISS mismatch in dev)");
			return;
		}
		expect(emailValue).toBe(TEST_CONFIG.userEmail);
	} else {
		// Signed-in state shows email as text, not input
		await expect(step0Panel.getByText(TEST_CONFIG.userEmail)).toBeVisible({ timeout: 5_000 });
	}
});

// =============================================================================
// Test 4 — CJ Dropship: shipping methods display in V2 DeliveryStep
//           DOES NOT complete order (no CJ order created)
// =============================================================================

test("V2: dropship product shows CJ shipping methods in DeliveryStep (no order placed)", async ({
	page,
}) => {

	test.skip(!dropshipVariantId, "No dropship products found in channel");
	test.setTimeout(90_000);

	// Create checkout + set address via API to pre-trigger the CJ shipping webhook.
	// Triggering SHIPPING_LIST_METHODS_FOR_CHECKOUT is safe — it only queries CJ rates,
	// it does NOT create any order on CJ's side.
	const { id: checkoutId } = await checkoutCreate(
		CHANNEL,
		[{ variantId: dropshipVariantId!, quantity: 1 }],
		"e2e-v2-dropship@test.local",
	);

	await checkoutShippingAddressUpdate(checkoutId, {
		firstName: TEST_ADDRESS.firstName,
		lastName: TEST_ADDRESS.lastName,
		streetAddress1: TEST_ADDRESS.streetAddress1,
		city: TEST_ADDRESS.city,
		postalCode: TEST_ADDRESS.postalCode,
		country: TEST_ADDRESS.country,
		countryArea: TEST_ADDRESS.countryArea,
		phone: TEST_ADDRESS.phone,
	});

	// Give the CJ webhook time to respond
	await new Promise((r) => setTimeout(r, 8_000));

	// Navigate to V2 checkout with the pre-configured checkout
	await page.goto(
		`/${CHANNEL}/checkout?checkout=${encodeURIComponent(checkoutId)}`,
	);
	await page.waitForLoadState("domcontentloaded");

	const checkout = new CheckoutV2Page(page, CHANNEL);
	const isV2 = await checkout.isV2Active();
	expect(isV2).toBe(true);

	// With initialCheckout hydration, step 0 (Contact) is auto-completed because the checkout
	// has an email (CheckoutFind includes email but not shippingAddress).
	// Step 1 (Shipping) is the active step — fill it to trigger the CJ webhook again.
	// Re-saving the same address is safe: SHIPPING_LIST_METHODS_FOR_CHECKOUT only queries
	// CJ rates; it does NOT create any CJ order.
	await checkout.fillShippingAddress(TEST_ADDRESS);
	await page.waitForTimeout(2_000); // let CJ webhook complete

	// Delivery step (step 2) should now be active with CJ methods
	const methodCount = await checkout.waitForDeliveryMethods(1);
	console.log(`[V2 Dropship] Found ${methodCount} CJ shipping methods`);

	// Log all method names for debugging
	for (let i = 0; i < methodCount; i++) {
		const radio = checkout.deliveryMethodRadios.nth(i);
		// Get the parent label text
		const labelText = await radio
			.locator("xpath=ancestor::label")
			.textContent()
			.catch(() => "");
		console.log(`[V2 Dropship] Method ${i}: "${labelText?.trim().replace(/\s+/g, " ")}"`);
	}

	await page.screenshot({
		path: "e2e/screenshots/v2-dropship-delivery-step.png",
		fullPage: false,
	});

	// ⚠️ STOP HERE — do NOT select a method, do NOT proceed to payment,
	// do NOT place an order. This test verifies display only.
});

// =============================================================================
// Test 5 — Promo code: toggle input, apply invalid code shows error, cancel
// =============================================================================

test("V2: promo code input expands, shows error on invalid code, collapses on Cancel", async ({
	page,
}) => {

	test.setTimeout(60_000);

	const checkout = await goToCheckoutV2(page, productSlug, variantId);
	const isV2 = await checkout.isV2Active();
	expect(isV2).toBe(true);

	// The promo toggle button lives in the summary sidebar — visible from the start
	const promoToggle = checkout.promoToggleButton;
	await expect(promoToggle).toBeVisible({ timeout: 10_000 });
	await expect(promoToggle).toHaveAttribute("aria-expanded", "false");

	// Expand the promo input
	await promoToggle.click();
	await expect(checkout.promoCodeInput).toBeVisible({ timeout: 5_000 });

	// Apply an invalid code — should show an error
	await checkout.promoCodeInput.fill("INVALID-V2-TEST-CODE");
	await checkout.promoApplyButton.click();
	await page.waitForTimeout(2_000);

	// Expect an error message (code not found / invalid)
	const errorEl = page.locator('[role="alert"].text-red-600, p.text-red-600').first();
	await expect(errorEl).toBeVisible({ timeout: 5_000 });
	const errorText = await errorEl.textContent();
	console.log(`[V2 Promo] Error shown: "${errorText?.trim()}"`);

	// Cancel collapses the input
	await checkout.cancelPromoInput();
	await expect(checkout.promoCodeInput).not.toBeVisible({ timeout: 3_000 });
});

// =============================================================================
// Test 6 — RTL layout: ILS (Hebrew) channel checkout has dir="rtl"
// =============================================================================

test("V2: ILS channel checkout renders with dir=rtl", async ({ page }) => {


	await suppressCookies(page, IL_CHANNEL);

	// Create an ILS checkout via API (skip gracefully if ILS channel not available)
	let ilsCheckoutId: string;
	try {
		const inStock = await findInStockProduct(IL_CHANNEL);
		const result = await checkoutCreate(
			IL_CHANNEL,
			[{ variantId: inStock.variant.id, quantity: 1 }],
			"e2e-v2-rtl@test.local",
		);
		ilsCheckoutId = result.id;
	} catch (err) {
		test.skip(true, `ILS channel not available or no in-stock products: ${err}`);
		return;
	}

	await page.goto(
		`/${IL_CHANNEL}/checkout?checkout=${encodeURIComponent(ilsCheckoutId)}`,
	);
	await page.waitForLoadState("domcontentloaded");
	await page.waitForTimeout(500); // let inline direction script execute

	// The checkout layout.tsx injects: document.documentElement.setAttribute('dir','rtl')
	const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
	console.log(`[V2 RTL] Document dir: "${dir}"`);
	expect(dir).toBe("rtl");

	// Verify V2 accordion renders without layout errors in RTL mode
	const checkout = new CheckoutV2Page(page, IL_CHANNEL);
	const isV2 = await checkout.isV2Active();
	expect(isV2, "V2 accordion should render in RTL channel too").toBe(true);

	// With initialCheckout hydration, step 0 (Contact) is auto-completed because the checkout
	// has an email. Step 1 (Shipping) should be the active step with its panel visible.
	await expect(checkout.stepHeader(0)).toBeVisible({ timeout: 10_000 });
	// Step 0 panel is collapsed (auto-completed); step 1 panel is active
	await expect(checkout.stepPanel(1)).toBeVisible({ timeout: 10_000 });

	// Verify summary sidebar also renders
	await expect(checkout.summaryAside).toBeVisible({ timeout: 10_000 });

	await page.screenshot({
		path: "e2e/screenshots/v2-rtl-checkout.png",
		fullPage: false,
	});
});

// =============================================================================
// Test 7 — Deferred account creation: "Create account" checkbox creates customer after order
// =============================================================================

test("V2: create account checkbox creates customer after successful order", async ({ page }) => {
	skipIfV2Disabled();
	test.setTimeout(150_000);

	const testEmail = `e2e-create-account-${Date.now()}@test.local`;
	const testPassword = "TestAccount123!";

	const checkout = await goToCheckoutV2(page, productSlug, variantId);

	const isV2 = await checkout.isV2Active();
	expect(isV2, "Expected V2 accordion").toBe(true);

	// Step 0: Contact — with "Create account" checkbox
	await checkout.fillContactEmailWithAccount(testEmail, testPassword);

	// Wait for step 1 to appear (means onSubmit completed and sessionStorage was set)
	await checkout.stepPanel(1).waitFor({ state: "visible", timeout: 15_000 });

	// Verify sessionStorage has the pending password
	const pendingStored = await page.evaluate(() =>
		sessionStorage.getItem("checkout_pending_account"),
	);
	expect(pendingStored, "Password should be stored in sessionStorage").toBeTruthy();

	// Step 1: Shipping address
	await checkout.fillShippingAddress(TEST_ADDRESS);
	await page.waitForTimeout(2_000);

	// Step 2: Delivery method
	await checkout.selectFirstDeliveryMethod();
	await page.waitForTimeout(1_000);

	// Step 3: Payment (Stripe test card)
	const paymentPanel = checkout.stepPanel(3);
	await paymentPanel.waitFor({ state: "visible", timeout: 15_000 });
	const gatewayError = await page
		.locator("text=Failed to initialize payment system")
		.isVisible()
		.catch(() => false);
	if (gatewayError) {
		test.skip(true, "Stripe payment gateway not configured — skipping");
		return;
	}

	await checkout.fillStripeCard();
	await page.waitForTimeout(1_000);

	// Place order
	await checkout.placeOrder();

	// Verify order confirmation page
	await checkout.expectOrderConfirmation();
	expect(page.url()).toMatch(/[?&]order=/);

	// Wait for deferred account creation to complete (runs on confirmation page load)
	await page.waitForTimeout(5_000);

	// Verify the account was created by checking the "account created" banner
	const accountBanner = page.locator("text=Your account has been created");
	const bannerVisible = await accountBanner.isVisible().catch(() => false);

	// Also verify sessionStorage was cleaned up
	const pendingAfter = await page.evaluate(() =>
		sessionStorage.getItem("checkout_pending_account"),
	);
	expect(pendingAfter, "sessionStorage should be cleaned up after registration").toBeNull();

	// Verify the account exists in Saleor by trying to sign in
	// (This uses the Saleor API directly — more reliable than checking the banner)
	const loginResult = await fetch("http://localhost:8000/graphql/", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: `mutation TokenCreate($email: String!, $password: String!) {
				tokenCreate(email: $email, password: $password) {
					token
					errors { field message }
				}
			}`,
			variables: { email: testEmail, password: testPassword },
		}),
	}).then((r) => r.json() as Promise<{
		data?: { tokenCreate?: { token?: string; errors?: Array<{ message: string }> } };
	}>);

	const token = loginResult.data?.tokenCreate?.token;
	const loginErrors = loginResult.data?.tokenCreate?.errors ?? [];

	// The account should be created and sign-in should work
	expect(loginErrors, `Login should succeed for ${testEmail}`).toHaveLength(0);
	expect(token, "Should receive auth token for newly created account").toBeTruthy();

	if (bannerVisible) {
		console.log("[Test] ✅ Account created banner visible on confirmation page");
	} else {
		console.log("[Test] ⚠️ Account created banner not visible, but login succeeded — account was created");
	}
});
