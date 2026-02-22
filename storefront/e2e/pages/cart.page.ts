import { type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class CartPage extends BasePage {
	constructor(page: Page, channel?: string) {
		super(page, channel);
	}

	async gotoCart() {
		await this.goto("/cart");
	}

	// --- Cart Drawer ---

	/** The cart drawer dialog (aria-label="Shopping Cart"). */
	get cartDrawer() {
		return this.page.getByRole("dialog", { name: /shopping cart/i });
	}

	/** Open the cart drawer by clicking the cart icon in header. */
	async openDrawer() {
		await this.page.getByRole("button", { name: /items? in cart/i }).click();
		await this.cartDrawer.waitFor({ state: "visible", timeout: 10_000 });
	}

	/** Wait for the cart drawer to be visible. */
	async waitForDrawerOpen() {
		await this.cartDrawer.waitFor({ state: "visible", timeout: 10_000 });
	}

	/** Close the cart drawer. */
	async closeDrawer() {
		await this.page.getByRole("button", { name: /close cart/i }).click();
		await this.cartDrawer.waitFor({ state: "hidden" });
	}

	/**
	 * Cart drawer product links — one per cart item.
	 * Used for counting items in the drawer.
	 */
	get drawerItems() {
		return this.cartDrawer.locator("a[href*='/products/']");
	}

	/** Cart drawer empty text (shown when no items in cart). */
	get drawerEmptyState() {
		return this.cartDrawer.locator("text=/haven't added any|your cart is empty/i").first();
	}

	// --- Cart Page ---

	/** Cart page heading. */
	get cartHeading() {
		return this.page.locator("main h1, main h2").first();
	}

	/** Checkout button — in drawer it's a button, on cart page it may be a link. */
	get checkoutButton() {
		return this.cartDrawer.getByRole("button", { name: /checkout/i })
			.or(this.page.getByRole("link", { name: /checkout/i }))
			.first();
	}

	/** Empty cart state — shown either in cart drawer or on cart page. */
	get emptyCartState() {
		return this.page.locator("text=/haven't added any|your cart is empty/i").first();
	}

	/** Get the quantity display — the element between the − and + buttons in the drawer. */
	drawerItemQuantity(index: number) {
		// All "−" buttons in the drawer, get the nth one, then its next sibling
		return this.cartDrawer.locator("button", { hasText: "−" }).nth(index)
			.locator("..").locator("> *:nth-child(2)");
	}

	/** Click the + button for a cart item in the drawer (by item index). */
	async increaseDrawerQuantity(index: number) {
		await this.cartDrawer.locator("button", { hasText: "+" }).nth(index).click();
	}

	/** Click the Delete button for a cart item in the drawer (by item index). */
	async deleteDrawerItem(index: number) {
		// Delete button may be icon-only with aria-label, so use getByRole for accessible name
		await this.cartDrawer.getByRole("button", { name: /delete/i }).nth(index).click();
	}

	/** Expect the cart drawer to have N items. */
	async expectDrawerItemCount(count: number) {
		await expect(this.drawerItems).toHaveCount(count, { timeout: 10_000 });
	}
}
