import { test, expect } from "@playwright/test";
import { TEST_CONFIG } from "./fixtures/test-data";

/**
 * Account page tests.
 *
 * NOTE: In the current dev environment, server-side authentication doesn't work
 * because the JWT issuer (PUBLIC_URL=https://api.halacosmetics.org) doesn't match
 * the internal API URL (http://aura-api:8000/graphql/). The @saleor/auth-sdk
 * refuses to attach the Bearer token when ISS doesn't match the request URL.
 *
 * This means all account pages redirect to /login even with valid cookies.
 * These tests verify the redirect behavior and page structure.
 * When the ISS mismatch is fixed, update tests to verify authenticated content.
 */
test.describe("Account", () => {
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

	test("account page requires authentication", async ({ page }) => {
		await page.goto(`/${TEST_CONFIG.channel}/account`);
		await page.waitForURL((url) => url.pathname.includes("/login"), {
			timeout: 15_000,
		});
		expect(page.url()).toContain("/login");
	});

	test("orders page requires authentication", async ({ page }) => {
		await page.goto(`/${TEST_CONFIG.channel}/account/orders`);
		await page.waitForURL((url) => url.pathname.includes("/login"), {
			timeout: 15_000,
		});
		expect(page.url()).toContain("/login");
		expect(page.url()).toContain("redirect=");
	});

	test("wishlist page requires authentication", async ({ page }) => {
		await page.goto(`/${TEST_CONFIG.channel}/account/wishlist`);
		await page.waitForURL((url) => url.pathname.includes("/login"), {
			timeout: 15_000,
		});
		expect(page.url()).toContain("/login");
	});

	test("addresses page requires authentication", async ({ page }) => {
		await page.goto(`/${TEST_CONFIG.channel}/account/addresses`);
		await page.waitForURL((url) => url.pathname.includes("/login"), {
			timeout: 15_000,
		});
		expect(page.url()).toContain("/login");
	});

	test("login page preserves redirect URL for account", async ({ page }) => {
		await page.goto(`/${TEST_CONFIG.channel}/account`);
		await page.waitForURL((url) => url.pathname.includes("/login"), {
			timeout: 15_000,
		});
		// The redirect param should point back to account
		expect(page.url()).toContain("redirect=");
		expect(page.url()).toContain("account");
	});
});
