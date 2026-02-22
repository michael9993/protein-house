import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "e2e/.env") });

const baseURL = process.env.STOREFRONT_URL || "http://localhost:3000";

export default defineConfig({
	testDir: "e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : 2,
	reporter: process.env.CI ? [["blob"], ["github"]] : [["html"], ["list"]],
	timeout: 60_000,
	expect: { timeout: 15_000 },
	use: {
		baseURL,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: process.env.CI ? "retain-on-failure" : "off",
		testIdAttribute: "data-testid",
		headless: true,
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
	},
	globalSetup: "e2e/global-setup.ts",
	projects: [
		{
			name: "setup",
			testMatch: /.*\.setup\.ts/,
		},
		{
			name: "e2e",
			dependencies: ["setup"],
			testMatch: /account\.spec\.ts/,
			use: {
				...devices["Desktop Chrome"],
				storageState: "e2e/.auth/user.json",
			},
		},
		{
			name: "guest",
			testIgnore: /account\.spec\.ts/,
			use: {
				...devices["Desktop Chrome"],
			},
		},
	],
});
