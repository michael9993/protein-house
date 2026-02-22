import { test, expect } from "@playwright/test";
import { SearchPage } from "./pages/search.page";
import { BasePage } from "./pages/base.page";
import { TEST_CONFIG } from "./fixtures/test-data";

test.describe("Search", () => {
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

	test("search for nonexistent product shows no results", async ({ page }) => {
		const searchPage = new SearchPage(page, TEST_CONFIG.channel);

		await searchPage.gotoSearch("xyznonexistent12345");
		await searchPage.expectNoResults();
	});

	test("search page loads with query parameter", async ({ page }) => {
		const searchPage = new SearchPage(page, TEST_CONFIG.channel);

		await searchPage.gotoSearch("test");
		await page.waitForLoadState("domcontentloaded");

		// The heading should be visible
		await expect(searchPage.heading).toBeVisible({ timeout: 15_000 });
	});

	test("search from header navigates to search or products page", async ({ page }) => {
		const basePage = new BasePage(page, TEST_CONFIG.channel);

		// Go to homepage
		await basePage.goto("");
		await basePage.waitForMainContent();

		// Use the header search input
		const searchVisible = await basePage.searchInput
			.isVisible({ timeout: 5_000 })
			.catch(() => false);

		if (searchVisible) {
			await basePage.searchFor("test");

			// Should navigate to search or products page with query
			await page.waitForURL(
				(url) => url.pathname.includes("/search") || url.pathname.includes("/products"),
				{ timeout: 10_000 },
			);
			const url = page.url();
			expect(url.includes("search") || url.includes("products")).toBe(true);
		} else {
			// Mobile — search might be behind a toggle button
			test.skip(true, "Search input not visible (mobile layout)");
		}
	});

	test("products listing page shows product cards", async ({ page }) => {
		// This test verifies that the main product browsing works,
		// which is the primary product discovery mechanism alongside search.
		await page.goto(`/${TEST_CONFIG.channel}/products`);
		await page.waitForLoadState("domcontentloaded");

		// Product cards are rendered as <article> elements
		const articles = page.locator("main article");
		await expect(articles.first()).toBeVisible({ timeout: 15_000 });

		const count = await articles.count();
		expect(count).toBeGreaterThanOrEqual(1);

		// Click first product to verify navigation
		const firstLink = articles.first().locator("a").first();
		await firstLink.click();

		await page.waitForURL((url) => url.pathname.includes("/products/"), {
			timeout: 10_000,
		});
		expect(page.url()).toContain("/products/");
	});
});
