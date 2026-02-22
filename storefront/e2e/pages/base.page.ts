import { type Page, expect } from "@playwright/test";
import { TEST_CONFIG } from "../fixtures/test-data";

export class BasePage {
	readonly page: Page;
	readonly channel: string;

	constructor(page: Page, channel = TEST_CONFIG.channel) {
		this.page = page;
		this.channel = channel;
	}

	/** Suppress cookie consent banner by setting localStorage before navigation. */
	async suppressCookieBanner() {
		await this.page.addInitScript((ch) => {
			localStorage.setItem(
				`aura_cookie_consent_${ch}`,
				JSON.stringify({
					essential: true,
					analytics: false,
					marketing: false,
					timestamp: Date.now(),
					version: 1,
				}),
			);
		}, this.channel);
	}

	/** Navigate to a channel-relative path. */
	async goto(path = "") {
		await this.page.goto(`/${this.channel}${path}`);
		await this.page.waitForLoadState("domcontentloaded");
	}

	/** Wait for the main content to render. */
	async waitForMainContent() {
		await this.page.locator("#main-content").waitFor({ state: "visible" });
	}

	/** Get the cart button in the header. */
	get cartButton() {
		return this.page.locator('[data-testid="CartNavItem"]');
	}

	/** Get the desktop search input. */
	get searchInput() {
		return this.page.locator("input#search-input");
	}

	/** Search for a term using the header search. */
	async searchFor(term: string) {
		await this.searchInput.fill(term);
		await this.searchInput.press("Enter");
		await this.page.waitForLoadState("domcontentloaded");
	}

	/** Assert no uncaught JS errors on the page. */
	async expectNoConsoleErrors() {
		const errors: string[] = [];
		this.page.on("pageerror", (err) => errors.push(err.message));
		// Give time for errors to surface
		await this.page.waitForTimeout(500);
		expect(errors).toHaveLength(0);
	}
}
