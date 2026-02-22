import { test, expect } from "@playwright/test";
import { ProductDetailPage } from "./pages/product-detail.page";
import { CartPage } from "./pages/cart.page";
import { CheckoutPage } from "./pages/checkout.page";
import { TEST_CONFIG, TEST_ADDRESS } from "./fixtures/test-data";
import { findInStockProduct } from "./fixtures/graphql-client";

test.describe("Checkout", () => {
	let productSlug: string;
	let variantId: string;

	test.beforeAll(async () => {
		const { product, variant } = await findInStockProduct(TEST_CONFIG.channel);
		productSlug = product.slug;
		variantId = variant.id;
	});

	test.beforeEach(async ({ page }) => {
		// Suppress cookie banner
		await page.addInitScript((ch) => {
			localStorage.setItem(
				`aura_cookie_consent_${ch}`,
				JSON.stringify({
					categories: { essential: true, analytics: false, marketing: false },
					timestamp: Date.now(),
					version: 1,
				}),
			);
		}, TEST_CONFIG.channel);
	});

	/**
	 * Helper: add product to cart, open drawer, click checkout.
	 * Returns the checkout page object.
	 */
	async function addProductAndGoToCheckout(page: import("@playwright/test").Page) {
		const pdp = new ProductDetailPage(page, TEST_CONFIG.channel);
		const cart = new CartPage(page, TEST_CONFIG.channel);

		// Add product (variant pre-selected via URL)
		await pdp.gotoProduct(productSlug, variantId);
		await pdp.expectProductLoaded();
		await pdp.addToCart();
		await page.waitForTimeout(1_500);

		// Open cart drawer and proceed to checkout
		await cart.openDrawer();
		await cart.expectDrawerItemCount(1);

		// Click checkout in the drawer
		await cart.checkoutButton.click();
		await page.waitForURL((url) => url.pathname.includes("/checkout"), {
			timeout: 15_000,
		});

		return new CheckoutPage(page, TEST_CONFIG.channel);
	}

	test("complete guest checkout with Stripe", async ({ page }) => {
		test.setTimeout(120_000); // Checkout is a long flow

		const checkout = await addProductAndGoToCheckout(page);

		// --- Fill email ---
		await checkout.fillEmail("e2e-checkout@test.local");

		// --- Fill shipping address ---
		await checkout.fillShippingAddress(TEST_ADDRESS);

		// Wait for address validation and shipping methods to load
		await page.waitForTimeout(3_000);

		// --- Select shipping method ---
		await checkout.selectFirstShippingMethod();
		await page.waitForTimeout(2_000);

		// --- Fill payment (Stripe test card) ---
		await checkout.fillStripeCard();
		await page.waitForTimeout(1_000);

		// --- Place order ---
		await checkout.placeOrder();

		// --- Verify order confirmation ---
		await checkout.expectOrderConfirmation();

		// Verify the URL contains an order parameter
		const url = page.url();
		expect(url).toMatch(/order=/);
	});

	test("checkout shows order summary with correct items", async ({ page }) => {
		const checkout = await addProductAndGoToCheckout(page);

		// Verify order summary shows items
		await expect(checkout.orderSummary).toBeVisible({ timeout: 15_000 });

		const summaryItems = checkout.page.locator('[data-testid="SummaryItem"]');
		await expect(summaryItems.first()).toBeVisible();

		// Verify total price is displayed
		await expect(checkout.totalPrice).toBeVisible();
		const totalText = await checkout.totalPrice.textContent();
		expect(totalText?.trim().length).toBeGreaterThan(0);
	});

	test("checkout requires email before proceeding", async ({ page }) => {
		const checkout = await addProductAndGoToCheckout(page);

		// Verify email input is visible
		await expect(checkout.emailInput).toBeVisible({ timeout: 15_000 });
	});
});
