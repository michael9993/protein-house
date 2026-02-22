import { test, expect } from "@playwright/test";
import { ProductDetailPage } from "./pages/product-detail.page";
import { CartPage } from "./pages/cart.page";
import { TEST_CONFIG } from "./fixtures/test-data";
import { findInStockProduct } from "./fixtures/graphql-client";

test.describe("Cart", () => {
	let productSlug: string;
	let variantId: string;

	test.beforeAll(async () => {
		// Find a product with stock for all cart tests
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

	test("add product to cart from PDP", async ({ page }) => {
		const pdp = new ProductDetailPage(page, TEST_CONFIG.channel);
		const cart = new CartPage(page, TEST_CONFIG.channel);

		// Navigate to product with variant pre-selected
		await pdp.gotoProduct(productSlug, variantId);
		await pdp.expectProductLoaded();

		// Add to cart (variant already selected via URL)
		await pdp.addToCart();

		// Wait for the "Added to Cart!" confirmation, then open the drawer
		await page.waitForTimeout(1_500);
		await cart.openDrawer();

		// Verify cart drawer has the item
		await expect(cart.drawerItems.first()).toBeVisible({ timeout: 10_000 });
	});

	test("cart drawer shows item count and checkout button", async ({ page }) => {
		const pdp = new ProductDetailPage(page, TEST_CONFIG.channel);
		const cart = new CartPage(page, TEST_CONFIG.channel);

		// Add a product
		await pdp.gotoProduct(productSlug, variantId);
		await pdp.expectProductLoaded();
		await pdp.addToCart();
		await page.waitForTimeout(1_500);

		// Open cart drawer
		await cart.openDrawer();
		await cart.expectDrawerItemCount(1);

		// Verify checkout button is present in the drawer
		await expect(cart.checkoutButton).toBeVisible();
	});

	test("update quantity in cart drawer", async ({ page }) => {
		const pdp = new ProductDetailPage(page, TEST_CONFIG.channel);
		const cart = new CartPage(page, TEST_CONFIG.channel);

		// Add product
		await pdp.gotoProduct(productSlug, variantId);
		await pdp.expectProductLoaded();
		await pdp.addToCart();
		await page.waitForTimeout(1_500);

		// Open drawer
		await cart.openDrawer();
		await cart.expectDrawerItemCount(1);

		// Increase quantity via + button
		await cart.increaseDrawerQuantity(0);
		await page.waitForTimeout(2_000); // Wait for API update

		// Verify quantity changed to 2
		const qtyText = await cart.drawerItemQuantity(0).textContent();
		expect(qtyText?.trim()).toBe("2");
	});

	test("remove item from cart drawer", async ({ page }) => {
		const pdp = new ProductDetailPage(page, TEST_CONFIG.channel);
		const cart = new CartPage(page, TEST_CONFIG.channel);

		// Add product
		await pdp.gotoProduct(productSlug, variantId);
		await pdp.expectProductLoaded();
		await pdp.addToCart();
		await page.waitForTimeout(1_500);

		// Open drawer
		await cart.openDrawer();
		await cart.expectDrawerItemCount(1);

		// Delete the item
		await cart.deleteDrawerItem(0);
		await page.waitForTimeout(2_000);

		// Verify cart drawer shows empty state
		await expect(cart.drawerEmptyState).toBeVisible({ timeout: 10_000 });
	});

	test("empty cart shows empty state", async ({ page }) => {
		const cart = new CartPage(page, TEST_CONFIG.channel);

		// Clear any existing cart cookie
		await page.context().clearCookies();

		// Navigate to homepage and open cart drawer
		await cart.goto("");
		await page.waitForLoadState("domcontentloaded");
		await cart.openDrawer();

		// Expect empty state in the drawer
		await expect(cart.emptyCartState).toBeVisible({ timeout: 15_000 });
	});
});
