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

	/** The cart drawer dialog. */
	get cartDrawer() {
		return this.page.locator('[role="dialog"][aria-modal="true"]');
	}

	/** Wait for the cart drawer to open. */
	async waitForDrawerOpen() {
		await this.cartDrawer.waitFor({ state: "visible", timeout: 10_000 });
	}

	/** Close the cart drawer. */
	async closeDrawer() {
		await this.page.locator("button.cart-drawer__close").click();
		await this.cartDrawer.waitFor({ state: "hidden" });
	}

	/** Cart drawer items. */
	get drawerItems() {
		return this.page.locator(".cart-drawer__item");
	}

	/** Checkout button in the cart drawer. */
	get drawerCheckoutButton() {
		return this.page.locator("button.cart-drawer__checkout-btn");
	}

	/** Cart drawer empty state. */
	get drawerEmptyState() {
		return this.page.locator(".cart-drawer__empty");
	}

	// --- Cart Page ---

	/** Cart page heading. */
	get cartHeading() {
		return this.page.locator("h1").first();
	}

	/** Cart line items on the cart page. */
	get cartLineItems() {
		return this.page.locator("ul.divide-y > li");
	}

	/** Promo code input on the cart page. */
	get promoInput() {
		return this.page.locator("input#promo");
	}

	/** Checkout button on the cart page. */
	get checkoutButton() {
		return this.page
			.getByRole("button", { name: /proceed to checkout|checkout/i })
			.first();
	}

	/** Empty cart state. */
	get emptyCartState() {
		return this.page.locator("h1").filter({ hasText: /empty|cart/i });
	}

	/** Get the quantity display for a cart item at index. */
	itemQuantity(index: number) {
		return this.cartLineItems.nth(index).locator(".text-sm.font-medium.text-neutral-700");
	}

	/** Click the increase quantity button for cart item at index. */
	async increaseQuantity(index: number) {
		const item = this.cartLineItems.nth(index);
		const plusBtn = item.locator("button").filter({ has: this.page.locator('svg[class*="plus"], .lucide-plus') });
		await plusBtn.click();
	}

	/** Click the delete button for cart item at index. */
	async deleteItem(index: number) {
		const item = this.cartLineItems.nth(index);
		const deleteBtn = item.locator("button.text-red-600");
		await deleteBtn.click();
	}

	/** Expect the cart to have N items. */
	async expectItemCount(count: number) {
		await expect(this.cartLineItems).toHaveCount(count, { timeout: 10_000 });
	}
}
