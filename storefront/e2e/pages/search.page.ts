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

	/** Product cards in search results — rendered as <article> elements. */
	get productCards() {
		return this.page.locator("main article");
	}

	/** No results message. */
	get noResultsMessage() {
		return this.page.locator("text=/no.*results|no.*products|nothing found/i").first();
	}

	/** Result count text (e.g., "Found 3 results for 'dress'"). */
	get resultCount() {
		return this.page.locator("text=/\\d+ results?/i").first();
	}

	/** Expect search results to be visible. */
	async expectResults(minCount = 1) {
		await expect(this.productCards.first()).toBeVisible({ timeout: 15_000 });
		const count = await this.productCards.count();
		expect(count).toBeGreaterThanOrEqual(minCount);
	}

	/** Expect no results message. */
	async expectNoResults() {
		// Wait for either explicit "no results" message or result count of 0
		await this.page.waitForLoadState("networkidle");
		const noResults = this.page.locator("text=/no.*results|no.*products|nothing found|0 results/i").first();
		await expect(noResults).toBeVisible({ timeout: 15_000 });
	}

	/** Click the first product in results. */
	async clickFirstProduct() {
		await this.productCards.first().locator("a").first().click();
		await this.page.waitForLoadState("domcontentloaded");
	}
}
