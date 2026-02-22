import { type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class SearchPage extends BasePage {
	constructor(page: Page, channel?: string) {
		super(page, channel);
	}

	async gotoSearch(query: string) {
		await this.goto(`/search?query=${encodeURIComponent(query)}`);
	}

	/** Page heading (usually "Search Results"). */
	get heading() {
		return this.page.locator("h1").first();
	}

	/** Product cards in search results. */
	get productCards() {
		return this.page.locator('[data-testid="ProductElement"]');
	}

	/** No results message. */
	get noResultsMessage() {
		return this.page.locator("p").filter({ hasText: /no products found/i });
	}

	/** Result count text. */
	get resultCount() {
		return this.page.locator("p.text-base.text-neutral-600").first();
	}

	/** Expect search results to be visible. */
	async expectResults(minCount = 1) {
		await expect(this.productCards.first()).toBeVisible({ timeout: 15_000 });
		const count = await this.productCards.count();
		expect(count).toBeGreaterThanOrEqual(minCount);
	}

	/** Expect no results message. */
	async expectNoResults() {
		await expect(this.noResultsMessage).toBeVisible({ timeout: 15_000 });
	}

	/** Click the first product in results. */
	async clickFirstProduct() {
		await this.productCards.first().locator("a").first().click();
		await this.page.waitForLoadState("domcontentloaded");
	}
}
