import { test as setup, expect } from "@playwright/test";
import { TEST_CONFIG } from "./fixtures/test-data";
import { tokenCreate } from "./fixtures/graphql-client";

const authFile = "e2e/.auth/user.json";

/**
 * The storefront's @saleor/auth-sdk stores tokens in httpOnly cookies.
 * Cookie key format: `{saleorApiUrl}+{tokenName}`.
 *
 * The server-side `saleorApiUrl` is the internal Docker URL
 * (http://aura-api:8000/graphql/) which differs from the public URL.
 * We must match the exact prefix the storefront uses.
 */
const SALEOR_API_URL_INTERNAL = "http://aura-api:8000/graphql/";
const ACCESS_TOKEN_KEY = `${SALEOR_API_URL_INTERNAL}+saleor_auth_access_token`;
const REFRESH_TOKEN_KEY = `${SALEOR_API_URL_INTERNAL}+saleor_auth_module_refresh_token`;
const AUTH_STATE_KEY = `${SALEOR_API_URL_INTERNAL}+saleor_auth_module_auth_state`;

/**
 * Setup: Authenticate the test user via the Saleor GraphQL API
 * and inject auth cookies into the browser context.
 *
 * Why not use the login form?
 * The login server action calls restoreUserCart() which hangs in dev
 * due to JWT issuer mismatch (ISS=production URL, but server-side requests
 * go to Docker internal URL). This is a known dev-environment issue.
 */
setup("authenticate", async ({ page, context }) => {
	const channel = TEST_CONFIG.channel;

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
	}, channel);

	// Get auth tokens from Saleor API
	const { token, refreshToken } = await tokenCreate(
		TEST_CONFIG.userEmail,
		TEST_CONFIG.userPassword,
	);

	// Inject auth cookies — must match the format @saleor/auth-sdk uses
	const cookieDefaults = {
		domain: "localhost",
		path: "/",
		httpOnly: true,
		sameSite: "Lax" as const,
		secure: false,
	};

	await context.addCookies([
		{ name: ACCESS_TOKEN_KEY, value: token, ...cookieDefaults },
		{ name: REFRESH_TOKEN_KEY, value: refreshToken, ...cookieDefaults },
		{ name: AUTH_STATE_KEY, value: "signedIn", ...cookieDefaults },
	]);

	// Verify authentication works by visiting the account page
	await page.goto(`/${channel}/account`);

	// If auth worked, we should NOT be redirected to /login
	await page.waitForLoadState("domcontentloaded");

	const url = page.url();
	if (url.includes("/login")) {
		throw new Error(
			`Auth setup failed: redirected to login at ${url}. ` +
				`Ensure the test user exists and cookie injection matches the auth SDK format.`,
		);
	}

	// Verify account content loaded
	await expect(page.locator("main, #main-content").first()).toBeVisible({
		timeout: 15_000,
	});

	console.log(`✓ Authenticated as ${TEST_CONFIG.userEmail}`);

	// Save storage state for reuse by authenticated tests
	await page.context().storageState({ path: authFile });
});
