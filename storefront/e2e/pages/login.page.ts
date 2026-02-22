import { type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
	constructor(page: Page, channel?: string) {
		super(page, channel);
	}

	async gotoLogin() {
		await this.goto("/login");
	}

	// --- Form elements ---

	get emailInput() {
		return this.page.locator("input#email");
	}

	get passwordInput() {
		return this.page.locator("input#password");
	}

	get submitButton() {
		return this.page.locator('button[type="submit"]');
	}

	get errorMessage() {
		return this.page.locator(".state-error");
	}

	get forgotPasswordLink() {
		return this.page.locator('a[href*="forgot-password"]');
	}

	// --- Register mode fields ---

	get firstNameInput() {
		return this.page.locator("input#firstName");
	}

	get lastNameInput() {
		return this.page.locator("input#lastName");
	}

	get confirmPasswordInput() {
		return this.page.locator("input#confirmPassword");
	}

	// --- Tab switching ---

	/** Switch to the "Sign Up" (register) tab. */
	async switchToRegister() {
		// The second button in the tab switcher
		const tabs = this.page.locator("button[type='button']").filter({
			hasText: /sign up|register|create/i,
		});
		await tabs.first().click();
		await expect(this.firstNameInput).toBeVisible();
	}

	/** Switch to the "Sign In" (login) tab. */
	async switchToLogin() {
		const tabs = this.page.locator("button[type='button']").filter({
			hasText: /sign in|login/i,
		});
		await tabs.first().click();
		await expect(this.emailInput).toBeVisible();
	}

	// --- Actions ---

	/** Fill and submit the login form. */
	async login(email: string, password: string) {
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.submitButton.click();
	}

	/** Fill and submit the registration form. */
	async register(data: {
		firstName: string;
		lastName: string;
		email: string;
		password: string;
	}) {
		await this.switchToRegister();
		await this.firstNameInput.fill(data.firstName);
		await this.lastNameInput.fill(data.lastName);
		await this.emailInput.fill(data.email);
		await this.passwordInput.fill(data.password);
		await this.confirmPasswordInput.fill(data.password);
		await this.submitButton.click();
	}

	/** Expect a successful login redirected to account page. */
	async expectLoggedIn() {
		await this.page.waitForURL(
			(url) => url.pathname.includes("/account") || !url.pathname.includes("/login"),
			{ timeout: 15_000 },
		);
	}

	/** Expect a login error message to be visible. */
	async expectLoginError() {
		await expect(this.errorMessage).toBeVisible({ timeout: 10_000 });
	}
}
