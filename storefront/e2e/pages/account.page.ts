import { type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class AccountPage extends BasePage {
	constructor(page: Page, channel?: string) {
		super(page, channel);
	}

	async gotoAccount() {
		await this.goto("/account");
	}

	async gotoOrders() {
		await this.goto("/account/orders");
	}

	async gotoWishlist() {
		await this.goto("/account/wishlist");
	}

	async gotoAddresses() {
		await this.goto("/account/addresses");
	}

	/** Account dashboard heading. */
	get dashboardHeading() {
		return this.page.locator("h1, h2").filter({ hasText: /welcome|dashboard|account/i }).first();
	}

	/** Order list items. */
	get orderRows() {
		return this.page.locator("table tbody tr, [class*='order-card'], li").filter({
			has: this.page.locator("a[href*='/orders/']"),
		});
	}

	/** Wishlist items. */
	get wishlistItems() {
		return this.page.locator('[data-testid="ProductElement"], .wishlist-item, li').filter({
			has: this.page.locator("img"),
		});
	}

	/** Click the first order in the orders list. */
	async clickFirstOrder() {
		const firstOrderLink = this.page.locator("a[href*='/orders/']").first();
		await expect(firstOrderLink).toBeVisible({ timeout: 10_000 });
		await firstOrderLink.click();
		await this.page.waitForLoadState("domcontentloaded");
	}

	/** Expect the account dashboard to be loaded. */
	async expectDashboardLoaded() {
		await expect(this.dashboardHeading).toBeVisible({ timeout: 15_000 });
	}

	/** Expect orders page to have content. */
	async expectOrdersLoaded() {
		// Either we see order rows or an empty state
		const hasOrders = await this.orderRows.first().isVisible().catch(() => false);
		const hasEmpty = await this.page
			.locator("text=/no orders|empty/i")
			.first()
			.isVisible()
			.catch(() => false);
		expect(hasOrders || hasEmpty).toBe(true);
	}
}
