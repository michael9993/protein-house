import { test as setup, expect } from "@playwright/test";
import { TEST_CONFIG } from "./fixtures/test-data";

const authFile = "e2e/.auth/user.json";

/**
 * Setup: Log in as the test user and save storageState for reuse
 * by all authenticated tests.
 */
setup("authenticate", async ({ page }) => {
	const channel = TEST_CONFIG.channel;

	// Suppress cookie banner
	await page.addInitScript((ch) => {
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
	}, channel);

	// Navigate to login page
	await page.goto(`/${channel}/login`);
	await page.waitForLoadState("domcontentloaded");

	// Fill login form
	await page.locator("input#email").fill(TEST_CONFIG.userEmail);
	await page.locator("input#password").fill(TEST_CONFIG.userPassword);
	await page.locator('button[type="submit"]').click();

	// Wait for redirect away from login page
	await page.waitForURL(
		(url) => !url.pathname.includes("/login"),
		{ timeout: 15_000 },
	);

	// Verify we're logged in — account link or user menu should be present
	await expect(
		page.locator('a[href*="/account"], [data-testid="user-menu"]').first(),
	).toBeVisible({ timeout: 10_000 });

	// Save storage state (cookies + localStorage) for reuse
	await page.context().storageState({ path: authFile });
});
